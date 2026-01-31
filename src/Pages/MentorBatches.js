import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  FiSearch,
  FiUsers,
  FiCalendar,
  FiClock,
  FiBarChart2,
  FiFilter,
  FiEye,
  FiChevronRight,
  FiRefreshCw,
} from "react-icons/fi";
import {
  RiNumber1,
  RiTeamLine,
  RiBookOpenLine,
  RiFileExcelLine,
} from "react-icons/ri";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://api.techsterker.com/api";

/* ---------- CSV HELPERS ---------- */
const convertToCSV = (arr) => {
  if (!arr || !arr.length) return "";
  const headers = Object.keys(arr[0]);
  const rows = [
    headers.join(","),
    ...arr.map((row) =>
      headers
        .map((h) => `"${(row[h] ?? "").toString().replace(/"/g, '""')}"`)
        .join(",")
    ),
  ];
  return rows.join("\n");
};

const downloadCSV = (csv, filename) => {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
/* -------------------------------- */

const MentorBatches = () => {
  const [mentorData, setMentorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const navigate = useNavigate();
  const mentorId = localStorage.getItem("mentorId");

  useEffect(() => {
    if (!mentorId) {
      setError("Mentor not logged in");
      setLoading(false);
      return;
    }
    fetchBatches();
  }, [mentorId]);

  const fetchBatches = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/mentorbatches/${mentorId}`);
      if (res.data?.success) {
        setMentorData(res.data);
      } else {
        setError("No batches found");
      }
    } catch {
      setError("Failed to fetch mentor batches");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- FILTERS ---------- */
  const categories = useMemo(() => {
    if (!mentorData?.teachingSchedule) return ["all"];
    const unique = new Set(
      mentorData.teachingSchedule.map((b) => b.category).filter(Boolean)
    );
    return ["all", ...unique];
  }, [mentorData]);

  const filteredBatches = useMemo(() => {
    if (!mentorData?.teachingSchedule) return [];
    return mentorData.teachingSchedule.filter((b) => {
      if (selectedCategory !== "all" && b.category !== selectedCategory)
        return false;
      if (!searchTerm.trim()) return true;
      const t = searchTerm.toLowerCase();
      return (
        b.batchNumber?.toLowerCase().includes(t) ||
        b.batchName?.toLowerCase().includes(t) ||
        b.category?.toLowerCase().includes(t)
      );
    });
  }, [mentorData, searchTerm, selectedCategory]);

  /* ---------- EXPORT ---------- */
  const handleExportCSV = () => {
    const rows = filteredBatches.map((b, i) => ({
      "#": i + 1,
      "Batch ID": b._id,
      "Batch Number": b.batchNumber,
      "Batch Name": b.batchName,
      "Start Date": new Date(b.startDate).toLocaleDateString(),
      Timings: b.timings,
      Duration: b.duration,
      Students: b.studentsCount,
      Category: b.category,
    }));

    const csv = convertToCSV(rows);
    downloadCSV(
      csv,
      `${mentorData?.mentor?.fullName || "mentor"}_batches.csv`
    );
  };

  const handleViewDetails = (enrollId) => {
    navigate(`/batchdetails/${enrollId}`);
  };

  /* ---------- STATES ---------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-cyan-50">
        <div className="h-14 w-14 border-b-4 border-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <h3 className="text-xl font-bold text-red-600 mb-2">Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchBatches}
            className="bg-gradient-to-r from-indigo-600 to-cyan-500 text-white px-6 py-3 rounded-xl flex items-center gap-2"
          >
            <FiRefreshCw /> Retry
          </button>
        </div>
      </div>
    );
  }

  /* ---------- RENDER ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl p-8 shadow-xl">
          <h1 className="text-3xl font-bold mb-1">My Teaching Batches</h1>
          <p className="opacity-90">
            Mentor: {mentorData.mentor.fullName}
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard icon={RiNumber1} label="Total Batches" value={mentorData.performanceMetrics.totalBatches} color="indigo" />
          <StatCard icon={RiTeamLine} label="Total Students" value={mentorData.performanceMetrics.totalStudents} color="emerald" />
          <StatCard icon={FiCalendar} label="Upcoming Batches" value={mentorData.teachingSchedule.length} color="amber" />
          <StatCard
            icon={FiBarChart2}
            label="Avg Students / Batch"
            value={
              mentorData.performanceMetrics.totalBatches
                ? Math.round(
                    mentorData.performanceMetrics.totalStudents /
                      mentorData.performanceMetrics.totalBatches
                  )
                : 0
            }
            color="purple"
          />
        </div>

        {/* CONTROLS */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-md p-6 mb-6 flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex gap-4 flex-col sm:flex-row w-full lg:w-auto">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search batch..."
                className="pl-12 pr-4 py-3 w-full border rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-4 py-3 border rounded-xl"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "all" ? "All Categories" : c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={!filteredBatches.length}
            className="bg-gradient-to-r from-emerald-500 to-teal-400 text-white px-6 py-3 rounded-xl flex items-center gap-2 disabled:opacity-50"
          >
            <RiFileExcelLine /> Export CSV
          </button>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-3xl shadow-xl overflow-x-auto">
          <table className="w-full">
            <thead className="bg-indigo-50">
              <tr>
                <th className="px-6 py-4 text-left">#</th>
                <th className="px-6 py-4 text-left">Batch</th>
                <th className="px-6 py-4 text-left">Schedule</th>
                <th className="px-6 py-4 text-left">Students</th>
                <th className="px-6 py-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-500">
                    <RiBookOpenLine className="mx-auto text-4xl mb-3" />
                    No batches found
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b, i) => (
                  <tr
                    key={b._id}
                    className="border-b hover:bg-indigo-50/40 transition"
                  >
                    <td className="px-6 py-4 font-semibold">{i + 1}</td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-indigo-700">{b.batchNumber}</div>
                      <div className="text-sm text-gray-500">{b.batchName}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FiCalendar /> {new Date(b.startDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <FiClock /> {b.timings}
                      </div>
                    </td>

                    <td className="px-6 py-4 font-bold text-emerald-600">
                      {b.studentsCount}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(b._id)}
                        className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl hover:bg-indigo-200 transition"
                      >
                        <FiEye /> View <FiChevronRight />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ---------- SMALL COMPONENT ---------- */
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    indigo: "from-indigo-500 to-indigo-400",
    emerald: "from-emerald-500 to-emerald-400",
    amber: "from-amber-500 to-amber-400",
    purple: "from-purple-500 to-purple-400",
  };

  return (
    <div className={`bg-gradient-to-r ${colors[color]} text-white rounded-2xl p-6 shadow-lg`}>
      <Icon className="text-2xl mb-2" />
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm opacity-90">{label}</div>
    </div>
  );
};

export default MentorBatches;
