import React, { useEffect, useState, useMemo } from "react";
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

const MentorCoursesList = () => {
  const [courses, setCourses] = useState([]);
  const [mentorName, setMentorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const mentorId = localStorage.getItem("mentorId");

  useEffect(() => {
    if (!mentorId) {
      setError("Mentor not logged in");
      return;
    }
    fetchCourses();
  }, [mentorId]);

  const fetchCourses = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/mentorenrollments/${mentorId}`);
      const data = res.data;

      if (data?.assignedCourses?.length > 0) {
        setCourses(data.assignedCourses);
        setMentorName(data.mentor?.fullName || "Mentor");
      } else {
        setCourses([]);
        setMentorName(data.mentor?.fullName || "Mentor");
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to fetch assigned courses.");
    } finally {
      setLoading(false);
    }
  };

  // Filter courses by search term (batchName, course description or category)
  const filteredCourses = useMemo(() => {
    if (!searchTerm.trim()) return courses;

    return courses.filter(course => {
      const batchName = course.batchName?.toLowerCase() || "";
      const description = course.courseId?.description?.toLowerCase() || "";
      const category = course.category?.toLowerCase() || "";
      const term = searchTerm.toLowerCase();
      return (
        batchName.includes(term) ||
        description.includes(term) ||
        category.includes(term)
      );
    });
  }, [courses, searchTerm]);

  const handleExportCSV = () => {
    // Prepare data for CSV - flatten structure to relevant fields
    const dataToExport = filteredCourses.map((course, idx) => ({
      "#": idx + 1,
      "Batch Name": course.batchName || "",
      "Batch Number": course.batchNumber || "",
      "Course Description": course.courseId?.description || "",
      Duration: course.duration || "",
      Price: course.courseId?.price || "",
      Timings: course.timings || "",
      "Start Date": course.startDate ? new Date(course.startDate).toLocaleDateString() : "",
      Category: course.category || "",
    }));

    const csv = convertToCSV(dataToExport);
    downloadCSV(csv, `${mentorName.replace(/\s+/g, "_")}_courses.csv`);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-lg">Loading courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-lg">{error}</p>
        <button
          onClick={fetchCourses}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg shadow-lg bg-white">
      <h2 className="text-2xl font-semibold text-blue-900 mb-4">
        Mentor: {mentorName}
      </h2>

      <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by Batch, Description, Category"
          className="border border-gray-300 rounded px-4 py-2 w-full max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <button
          onClick={handleExportCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          disabled={filteredCourses.length === 0}
          title={filteredCourses.length === 0 ? "No courses to export" : "Export CSV"}
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="p-3 border">#</th>
              <th className="p-3 border">Batch Name</th>
              <th className="p-3 border">Batch Number</th>
              <th className="p-3 border">Course Description</th>
              <th className="p-3 border">Duration</th>
              <th className="p-3 border">Price</th>
              <th className="p-3 border">Timings</th>
              <th className="p-3 border">Start Date</th>
              <th className="p-3 border">Category</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-6 text-center text-gray-500">
                  No assigned courses found.
                </td>
              </tr>
            ) : (
              filteredCourses.map((course, idx) => (
                <tr key={course._id || idx} className="border-b hover:bg-gray-50">
                  <td className="p-3 border text-center">{idx + 1}</td>
                  <td className="p-3 border">{course.batchName}</td>
                  <td className="p-3 border">{course.batchNumber}</td>
                  <td className="p-3 border">{course.courseId?.description || "-"}</td>
                  <td className="p-3 border">{course.duration}</td>
                  <td className="p-3 border">₹{course.courseId?.price || "0"}</td>
                  <td className="p-3 border">{course.timings}</td>
                  <td className="p-3 border">
                    {course.startDate ? new Date(course.startDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="p-3 border">{course.category || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MentorCoursesList;
