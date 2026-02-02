import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    FiSearch,
    FiDownload,
    FiChevronLeft,
    FiChevronRight,
    FiEye,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const API_URL = "https://api.techsterker.com/api/admin/modules";
const PAGE_SIZE = 5;

/* ---------- RAW FALLBACK DATA (DEV SAFE) ---------- */
const MOCK_DATA = [
    {
        _id: "1",
        className: "Intro to AI & ML",
        batch: "Batch #B-998",
        course: "AI & ML",
        uploadedAt: "2026-01-31T10:15:30.000Z",
        mentorName: "Gana",
    },
    {
        _id: "2",
        className: "Intro to Cyber Security",
        batch: "Batch #B-992",
        course: "Cyber Security",
        uploadedAt: "2026-02-01T09:45:10.000Z",
        mentorName: "Vijay",
    },

    // 🔽 NEW DATA (10 MORE)

    {
        _id: "3",
        className: "Python for Data Science",
        batch: "Batch #B-1001",
        course: "Data Science",
        uploadedAt: "2026-02-02T11:20:45.000Z",
        mentorName: "Anjali",
    },
    {
        _id: "4",
        className: "Statistics Fundamentals",
        batch: "Batch #B-1002",
        course: "Data Science",
        uploadedAt: "2026-02-03T14:10:20.000Z",
        mentorName: "Anjali",
    },
    {
        _id: "5",
        className: "Web Development Basics",
        batch: "Batch #B-1003",
        course: "Full Stack Development",
        uploadedAt: "2026-02-04T10:00:00.000Z",
        mentorName: "Rahul",
    },
    {
        _id: "6",
        className: "React JS Essentials",
        batch: "Batch #B-1004",
        course: "Full Stack Development",
        uploadedAt: "2026-02-05T16:35:10.000Z",
        mentorName: "Rahul",
    },
    {
        _id: "7",
        className: "Node.js & Express",
        batch: "Batch #B-1005",
        course: "Backend Development",
        uploadedAt: "2026-02-06T12:50:30.000Z",
        mentorName: "Suresh",
    },
    {
        _id: "8",
        className: "Database Design & SQL",
        batch: "Batch #B-1006",
        course: "Backend Development",
        uploadedAt: "2026-02-07T09:30:00.000Z",
        mentorName: "Suresh",
    },
    {
        _id: "9",
        className: "Cloud Computing Basics",
        batch: "Batch #B-1007",
        course: "Cloud Computing",
        uploadedAt: "2026-02-08T15:15:45.000Z",
        mentorName: "Neha",
    },
    {
        _id: "10",
        className: "AWS Core Services",
        batch: "Batch #B-1008",
        course: "Cloud Computing",
        uploadedAt: "2026-02-09T11:40:10.000Z",
        mentorName: "Neha",
    },
    {
        _id: "11",
        className: "Ethical Hacking Basics",
        batch: "Batch #B-1009",
        course: "Cyber Security",
        uploadedAt: "2026-02-10T13:25:00.000Z",
        mentorName: "Vijay",
    },
    {
        _id: "12",
        className: "Advanced Machine Learning",
        batch: "Batch #B-1010",
        course: "AI & ML",
        uploadedAt: "2026-02-11T17:05:30.000Z",
        mentorName: "Gana",
    },
];


const MentorClassModule = () => {
    const navigate = useNavigate();

    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [mentorFilter, setMentorFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);

    /* ---------------- FETCH DATA ---------------- */
    useEffect(() => {
        const fetchModules = async () => {
            try {
                const res = await axios.get(API_URL);
                setModules(res.data?.data?.length ? res.data.data : MOCK_DATA);
            } catch {
                setModules(MOCK_DATA); // fallback
            } finally {
                setLoading(false);
            }
        };
        fetchModules();
    }, []);

    /* ---------------- FILTER OPTIONS ---------------- */
    const mentors = useMemo(() => {
        const unique = new Set(modules.map((m) => m.mentorName));
        return ["all", ...unique];
    }, [modules]);

    /* ---------------- FILTER + SEARCH ---------------- */
    const filteredData = useMemo(() => {
        return modules.filter((item) => {
            if (mentorFilter !== "all" && item.mentorName !== mentorFilter)
                return false;

            if (!search.trim()) return true;
            const t = search.toLowerCase();
            return (
                item.className.toLowerCase().includes(t) ||
                item.batch.toLowerCase().includes(t) ||
                item.mentorName.toLowerCase().includes(t)
            );
        });
    }, [modules, search, mentorFilter]);

    /* ---------------- PAGINATION ---------------- */
    const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    /* ---------------- CSV EXPORT ---------------- */
    const exportCSV = () => {
        const headers = [
            "Class Name",
            "Batch",
            "Course Time",
            "Uploaded Time",
            "Mentor",
        ];

        const rows = filteredData.map((m) => [
            m.className,
            m.batch,
            m.course,
            new Date(m.uploadedAt).toLocaleString(),
            m.mentorName,
        ]);

        const csv =
            headers.join(",") +
            "\n" +
            rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "modules_list.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    /* ---------------- LOADING ---------------- */
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="h-12 w-12 border-b-2 border-[#a51d34] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">

                {/* HEADER */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#000]">
                            Class Modules
                        </h1>
                        <p className="text-sm text-gray-600">
                            Admin overview of all uploaded classes
                        </p>
                    </div>

                    <button
                        onClick={exportCSV}
                        className="bg-blue-400 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-[#8f182c]"
                    >
                        <FiDownload /> Export CSV
                    </button>
                </div>

                {/* FILTER BAR */}
                <div className="bg-white/70 backdrop-blur-md rounded-xl shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#a51d34]/30"
                            placeholder="Search class, batch or mentor..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <select
                        className="border rounded-lg px-4 py-2"
                        value={mentorFilter}
                        onChange={(e) => setMentorFilter(e.target.value)}
                    >
                        {mentors.map((m) => (
                            <option key={m} value={m}>
                                {m === "all" ? "All Mentors" : m}
                            </option>
                        ))}
                    </select>
                </div>

                {/* TABLE */}
                <div className="bg-white rounded-xl shadow-md overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-blue-400 text-white">
                            <tr>
                                <th className="px-4 py-3 text-left">S NO</th>
                                <th className="px-4 py-3 text-left">Class Name</th>
                                <th className="px-4 py-3 text-left">Batch</th>
                                <th className="px-4 py-3 text-left">Course</th>
                                <th className="px-4 py-3 text-left">Uploaded</th>
                                <th className="px-4 py-3 text-left">Mentor</th>
                                <th className="px-4 py-3 text-left">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-10 text-gray-500">
                                        No modules found
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((m, index) => (
                                    <tr
                                        key={m._id}
                                        className="border-b hover:bg-gray-50 transition"
                                    >
                                        <td className="px-4 py-3 font-medium">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                                        <td className="px-4 py-3 font-medium">{m.className}</td>
                                        <td className="px-4 py-3">{m.batch}</td>
                                        <td className="px-4 py-3">{m.course}</td>
                                        <td className="px-4 py-3">
                                            {new Date(m.uploadedAt).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 text-xs rounded-full bg-blue-400 text-white">
                                                {m.mentorName}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() =>
                                                    navigate(`/admin/modules/${m._id}`)
                                                }
                                                className="flex items-center gap-1 text-[#a51d34] hover:underline"
                                            >
                                                <FiEye /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-6">
                        <p className="text-sm text-gray-500">
                            Page {currentPage} of {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => p - 1)}
                                className="px-3 py-2 border rounded-lg disabled:opacity-50"
                            >
                                <FiChevronLeft />
                            </button>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((p) => p + 1)}
                                className="px-3 py-2 border rounded-lg disabled:opacity-50"
                            >
                                <FiChevronRight />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MentorClassModule;
