import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

const API_BASE = "https://api.techsterker.com/api";

const MentorGetAttendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [mentorId, setMentorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // new status filter

  useEffect(() => {
    const storedMentorId = localStorage.getItem("mentorId");
    if (!storedMentorId) {
      setError("Mentor not logged in.");
      return;
    }
    setMentorId(storedMentorId);
  }, []);

  useEffect(() => {
    if (!mentorId) return;

    const fetchAttendance = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API_BASE}/getattendance/${mentorId}`);
        if (res.data.success) {
          setAttendanceData(res.data.attendance || []);
        } else {
          setAttendanceData([]);
          setError("No attendance records found.");
        }
      } catch (err) {
        console.error("Error fetching attendance:", err);
        setError("Failed to fetch attendance.");
        setAttendanceData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [mentorId]);

  // Filter attendance by search term and status filter
  const filteredData = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase().trim();
    return attendanceData.filter((entry) => {
      const matchesSearch =
        entry.subject?.toLowerCase().includes(lowerSearch) ||
        entry.studentName?.toLowerCase().includes(lowerSearch) ||
        entry.enrollmentId?.toLowerCase().includes(lowerSearch);

      const matchesStatus =
        statusFilter === "all" || entry.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [attendanceData, searchTerm, statusFilter]);

  // CSV Export helper
  const exportToCSV = () => {
    if (!filteredData.length) return;

    const headers = [
      "Subject",
      "Date",
      "Timing",
      "Student Name",
      "Enrollment ID",
      "Status",
    ];

    const rows = filteredData.map((entry) => [
      entry.subject || "",
      entry.date ? new Date(entry.date).toLocaleDateString("en-IN") : "",
      entry.timing || "",
      entry.studentName || "",
      entry.enrollmentId || "",
      entry.status || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows]
        .map((e) =>
          e
            .map((v) => `"${v.replace(/"/g, '""')}"`) // escape quotes
            .join(",")
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `attendance_${mentorId}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-lg">Loading attendance records...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-blue-900 mb-2 text-center">
        Mentor Attendance Records
      </h2>
      {mentorId && (
        <p className="text-center text-gray-700 mb-6">
          Mentor ID: <span className="font-mono">{mentorId}</span>
        </p>
      )}

      {error && (
        <p className="text-center text-red-600 mb-4 text-lg">{error}</p>
      )}

      {/* Filters + Export controls */}
      <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
        <div className="flex gap-4 flex-1 max-w-md">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by attendance status"
          >
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            {/* Add more statuses here if needed */}
          </select>

          <input
            type="text"
            placeholder="Search by subject, student, or enrollment ID..."
            className="border border-gray-300 rounded-md px-4 py-2 flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={exportToCSV}
          disabled={filteredData.length === 0}
          className={`bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition ${
            filteredData.length === 0 ? "opacity-50 cursor-not-allowed" : ""
          }`}
          title={filteredData.length === 0 ? "No data to export" : "Export to CSV"}
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-3 border">#</th>
              <th className="p-3 border">Subject</th>
              <th className="p-3 border">Date</th>
              <th className="p-3 border">Timing</th>
              <th className="p-3 border">Student Name</th>
              <th className="p-3 border">Enrollment ID</th>
              <th className="p-3 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  {error ? error : "No attendance data available."}
                </td>
              </tr>
            ) : (
              filteredData.map((entry, idx) => (
                <tr
                  key={entry._id || idx}
                  className={`border-b ${
                    entry.status === "present"
                      ? "bg-green-50"
                      : entry.status === "absent"
                      ? "bg-red-50"
                      : ""
                  } hover:bg-gray-100`}
                >
                  <td className="p-3 border text-center">{idx + 1}</td>
                  <td className="p-3 border">{entry.subject || "-"}</td>
                  <td className="p-3 border">
                    {entry.date
                      ? new Date(entry.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </td>
                  <td className="p-3 border">{entry.timing || "-"}</td>
                  <td className="p-3 border">{entry.studentName || "-"}</td>
                  <td className="p-3 border">{entry.enrollmentId || "-"}</td>
                  <td
                    className={`p-3 border font-semibold text-center ${
                      entry.status === "present"
                        ? "text-green-700"
                        : entry.status === "absent"
                        ? "text-red-700"
                        : "text-gray-700"
                    }`}
                  >
                    {entry.status || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MentorGetAttendance;
