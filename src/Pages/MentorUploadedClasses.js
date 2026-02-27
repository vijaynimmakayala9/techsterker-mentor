import React, { useEffect, useState, useMemo } from "react";
import { MdPlayCircle, MdDownload } from "react-icons/md";
import { utils, writeFile } from "xlsx";

const mentorId = localStorage.getItem("mentorId");

const API =
    `https://api.techsterker.com/api/mentorliveclassesvideos/${mentorId}`;
const BASE = "https://api.techsterker.com";

export default function MentorUploadedClassesTable() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState(null);

    const [search, setSearch] = useState("");
    const [courseFilter, setCourseFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const videosPerPage = 5;

    useEffect(() => { fetchVideos(); }, []);

    useEffect(() => {
        const esc = (e) => e.key === "Escape" && setSelectedVideo(null);
        window.addEventListener("keydown", esc);
        return () => window.removeEventListener("keydown", esc);
    }, []);

    const fetchVideos = async () => {
        try {
            const res = await fetch(API);
            const data = await res.json();
            setVideos(data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatSize = (bytes) =>
        bytes ? (bytes / 1024 / 1024).toFixed(2) + " MB" : "-";

    const uniqueCourses = [
        "All",
        ...new Set(videos.map((v) => v.course?.name).filter(Boolean)),
    ];

    const filteredVideos = useMemo(() => {
        return videos.filter((v) => {
            const searchText = search.toLowerCase();
            const matchesSearch =
                v.title.toLowerCase().includes(searchText) ||
                v.course?.name.toLowerCase().includes(searchText) ||
                v.liveClass?.subjectName.toLowerCase().includes(searchText);

            const matchesCourse =
                courseFilter === "All" || v.course?.name === courseFilter;

            return matchesSearch && matchesCourse;
        });
    }, [videos, search, courseFilter]);

    const totalPages = Math.ceil(filteredVideos.length / videosPerPage);
    const indexOfLast = currentPage * videosPerPage;
    const indexOfFirst = indexOfLast - videosPerPage;
    const currentVideos = filteredVideos.slice(indexOfFirst, indexOfLast);

    // ⭐ Export Excel
    const exportData = () => {
        const rows = filteredVideos.map((v, i) => ({
            "S No": i + 1,
            Title: v.title,
            Course: v.course?.name,
            Subject: v.liveClass?.subjectName,
            Date: new Date(v.liveClass?.date).toLocaleDateString(),
            Timing: v.liveClass?.timing,
            Size: formatSize(v.videoSize),
            Views: v.views,
        }));

        const ws = utils.json_to_sheet(rows);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Videos");
        writeFile(wb, "Mentor_Videos.xlsx");
    };

    // ⭐ Ellipsis pagination logic
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible)
            return [...Array(totalPages)].map((_, i) => i + 1);

        pages.push(1);
        if (currentPage > 3) pages.push("...");

        for (let i = currentPage - 1; i <= currentPage + 1; i++)
            if (i > 1 && i < totalPages) pages.push(i);

        if (currentPage < totalPages - 2) pages.push("...");
        pages.push(totalPages);

        return pages;
    };

    if (loading)
        return <div className="p-10 text-center text-gray-500">Loading videos...</div>;

    return (
        <div className="p-6 sm:p-10 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Uploaded Class Videos</h1>
                <button
                    onClick={exportData}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                >
                    Export
                </button>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Search..."
                    className="w-full sm:w-1/2 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                    }}
                />
                <select
                    value={courseFilter}
                    onChange={(e) => {
                        setCourseFilter(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="px-4 py-2 border rounded-xl"
                >
                    {uniqueCourses.map((c) => (
                        <option key={c}>{c}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                            <tr>
                                <th className="px-6 py-4">S No</th>
                                <th className="px-6 py-4">Title</th>
                                <th className="px-6 py-4">Course</th>
                                <th className="px-6 py-4">Subject</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Timing</th>
                                <th className="px-6 py-4">Size</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {currentVideos.map((v, index) => (
                                <tr key={v._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">{indexOfFirst + index + 1}</td>
                                    <td className="px-6 py-4 font-semibold">{v.title}</td>
                                    <td className="px-6 py-4 text-indigo-600">{v.course?.name}</td>
                                    <td className="px-6 py-4">{v.liveClass?.subjectName}</td>
                                    <td className="px-6 py-4">
                                        {new Date(v.liveClass?.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">{v.liveClass?.timing}</td>
                                    <td className="px-6 py-4">{formatSize(v.videoSize)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">

                                            {/* Watch */}
                                            <button
                                                onClick={() => setSelectedVideo(v)}
                                                className="flex items-center justify-center gap-1 px-3 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 w-full sm:w-auto"
                                                title="Watch Video"
                                            >
                                                <MdPlayCircle className="text-xl" />
                                                <span className="text-xs font-semibold sm:hidden">Watch</span>
                                            </button>

                                            {/* Download */}
                                            <a
                                                href={`${BASE}${v.videoUrl}`}
                                                download
                                                className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 w-full sm:w-auto"
                                                title="Download"
                                            >
                                                <MdDownload className="text-xl" />
                                                <span className="text-xs font-semibold sm:hidden">Download</span>
                                            </a>

                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                    className="px-4 py-2 bg-gray-200 rounded-lg">Prev</button>

                {getPageNumbers().map((p, i) =>
                    p === "..." ? (
                        <span key={i} className="px-2">...</span>
                    ) : (
                        <button key={i} onClick={() => setCurrentPage(p)}
                            className={`px-4 py-2 rounded-lg ${currentPage === p ? "bg-indigo-600 text-white" : "bg-gray-200"}`}>
                            {p}
                        </button>
                    )
                )}

                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
                    className="px-4 py-2 bg-gray-200 rounded-lg">Next</button>
            </div>

            {/* Video Modal */}
            {selectedVideo && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4"
                    onClick={() => setSelectedVideo(null)}>
                    <div className="bg-black rounded-2xl w-full max-w-4xl"
                        onClick={(e) => e.stopPropagation()}>
                        <video src={`${BASE}${selectedVideo.videoUrl}`} controls autoPlay className="w-full max-h-[70vh]" />
                    </div>
                </div>
            )}
        </div>
    );
}