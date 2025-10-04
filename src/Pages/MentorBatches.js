import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

const API_BASE = "https://api.techsterker.com/api";

// Utility to convert array of objects to CSV string
const convertToCSV = (arr) => {
  if (!arr || arr.length === 0) return "";

  const headers = Object.keys(arr[0]);
  const csvRows = [
    headers.join(","), // header row first
    ...arr.map(row =>
      headers
        .map(fieldName => {
          const escaped = (row[fieldName] || "").toString().replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    ),
  ];
  return csvRows.join("\n");
};

// Utility to trigger CSV download
const downloadCSV = (csv, filename = "export.csv") => {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const MentorBatches = () => {
  const [mentorData, setMentorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const mentorId = localStorage.getItem("mentorId");

  useEffect(() => {
    if (!mentorId) {
      setError("Mentor not logged in");
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
        setError("No batches found for this mentor.");
      }
    } catch (err) {
      console.error("Error fetching mentor batches:", err);
      setError("Failed to fetch mentor batches.");
    } finally {
      setLoading(false);
    }
  };

  // Filter batches based on search term
  const filteredBatches = useMemo(() => {
    if (!searchTerm.trim()) return mentorData?.teachingSchedule || [];

    return mentorData?.teachingSchedule.filter(batch => {
      const batchNumber = batch.batchNumber?.toLowerCase() || "";
      const batchName = batch.batchName?.toLowerCase() || "";
      const category = batch.category?.toLowerCase() || "";
      const term = searchTerm.toLowerCase();
      return (
        batchNumber.includes(term) ||
        batchName.includes(term) ||
        category.includes(term)
      );
    });
  }, [mentorData, searchTerm]);

  const handleExportCSV = () => {
    // Prepare data for CSV
    const dataToExport = filteredBatches.map((batch, idx) => ({
      "#": idx + 1,
      "Batch Number": batch.batchNumber || "",
      "Batch Name": batch.batchName || "",
      "Start Date": new Date(batch.startDate).toLocaleDateString(),
      Timings: batch.timings || "",
      Duration: batch.duration || "",
      "Students Count": batch.studentsCount || "",
      Category: batch.category || "",
    }));

    const csv = convertToCSV(dataToExport);
    downloadCSV(csv, `${mentorData.mentor.fullName.replace(/\s+/g, "_")}_batches.csv`);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-lg">Loading batches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-lg">{error}</p>
        <button
          onClick={fetchBatches}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return mentorData ? (
    <div className="p-4 border rounded-lg shadow-lg bg-white">
      <h2 className="text-2xl font-semibold text-blue-900 mb-4">
        Mentor: {mentorData.mentor.fullName}
      </h2>

      {/* Search and Export Controls */}
      <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by Batch Number, Name, or Category"
          className="border border-gray-300 rounded px-4 py-2 w-full max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <button
          onClick={handleExportCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          disabled={filteredBatches.length === 0}
          title={filteredBatches.length === 0 ? "No batches to export" : "Export CSV"}
        >
          Export CSV
        </button>
      </div>

      {/* Performance Metrics */}
      <div className="mb-4">
        <p>Total Batches: {mentorData.performanceMetrics?.totalBatches}</p>
        <p>Total Students: {mentorData.performanceMetrics?.totalStudents}</p>
      </div>

      {/* Teaching Schedule Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="p-3 border">#</th>
              <th className="p-3 border">Batch Number</th>
              <th className="p-3 border">Batch Name</th>
              <th className="p-3 border">Start Date</th>
              <th className="p-3 border">Timings</th>
              <th className="p-3 border">Duration</th>
              <th className="p-3 border">Students Count</th>
              <th className="p-3 border">Category</th>
            </tr>
          </thead>
          <tbody>
            {filteredBatches.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">
                  No batches assigned.
                </td>
              </tr>
            ) : (
              filteredBatches.map((batch, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-3 border">{idx + 1}</td>
                  <td className="p-3 border">{batch.batchNumber}</td>
                  <td className="p-3 border">{batch.batchName}</td>
                  <td className="p-3 border">{new Date(batch.startDate).toLocaleDateString()}</td>
                  <td className="p-3 border">{batch.timings}</td>
                  <td className="p-3 border">{batch.duration}</td>
                  <td className="p-3 border">{batch.studentsCount}</td>
                  <td className="p-3 border">{batch.category}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  ) : null;
};

export default MentorBatches;
