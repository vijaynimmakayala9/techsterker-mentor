import React, { useState, useEffect } from "react";
import axios from "axios";
import { utils, writeFile } from "xlsx";

const API_BASE = "https://api.techsterker.com/api";

const MentorEnrollments = () => {
  const [mentorData, setMentorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exportLimit, setExportLimit] = useState(10);

  const mentorId = localStorage.getItem("mentorId");

  useEffect(() => {
    if (!mentorId) {
      setError("Mentor not logged in");
      return;
    }
    fetchMentorData();
  }, [mentorId]);

  const fetchMentorData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/mentorenrollments/${mentorId}`);
      if (res.data?.success) {
        setMentorData(res.data);
      } else {
        setError("No data found for this mentor.");
      }
    } catch (err) {
      console.error("Error fetching mentor data:", err);
      setError("Failed to fetch mentor data.");
    } finally {
      setLoading(false);
    }
  };

  const exportData = (type) => {
    if (!mentorData) return;

    const assignedCourses = mentorData.assignedCourses
      .slice(0, exportLimit)
      .map((course) => ({
        BatchNumber: course.batchNumber,
        BatchName: course.batchName,
        CourseDescription: course.courseId.description,
        StartDate: new Date(course.startDate).toLocaleDateString(),
        Timings: course.timings,
        Duration: course.duration,
        Category: course.category,
        EnrolledStudents: course.enrolledUsers.map((u) => u.email).join(", "),
      }));

    if (assignedCourses.length === 0) {
      alert("No data to export.");
      return;
    }

    const ws = utils.json_to_sheet(assignedCourses);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Assigned Courses");
    writeFile(wb, `mentor_assigned_courses.${type}`);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-lg">Loading mentor data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-lg">{error}</p>
        <button
          onClick={fetchMentorData}
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
        Welcome, {mentorData.mentor.fullName}
      </h2>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-100 rounded shadow text-center">
          <p className="text-lg font-medium">Total Batches</p>
          <p className="text-2xl font-bold">{mentorData.stats.totalBatches}</p>
        </div>
        <div className="p-4 bg-green-100 rounded shadow text-center">
          <p className="text-lg font-medium">Total Assigned Courses</p>
          <p className="text-2xl font-bold">{mentorData.stats.totalAssignedCourses}</p>
        </div>
        <div className="p-4 bg-yellow-100 rounded shadow text-center">
          <p className="text-lg font-medium">Total Students</p>
          <p className="text-2xl font-bold">{mentorData.stats.totalStudents}</p>
        </div>
      </div>

      {/* Assigned Courses Table */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-blue-900">Assigned Courses</h3>
        <div className="flex gap-2 items-center">
          <select
            className="border border-gray-300 p-2 rounded"
            value={exportLimit}
            onChange={(e) => setExportLimit(parseInt(e.target.value, 10))}
          >
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={() => exportData("csv")}
          >
            Export CSV
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => exportData("xlsx")}
          >
            Export Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="p-3 border">#</th>
              <th className="p-3 border">Batch Number</th>
              <th className="p-3 border">Batch Name</th>
              <th className="p-3 border">Course Description</th>
              <th className="p-3 border">Start Date</th>
              <th className="p-3 border">Timings</th>
              <th className="p-3 border">Duration</th>
              <th className="p-3 border">Category</th>
              <th className="p-3 border">Enrolled Students</th>
            </tr>
          </thead>
          <tbody>
            {mentorData.assignedCourses.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-6 text-center text-gray-500">
                  No assigned courses found.
                </td>
              </tr>
            ) : (
              mentorData.assignedCourses.map((course, idx) => (
                <tr key={course._id} className="border-b hover:bg-gray-50">
                  <td className="p-3 border">{idx + 1}</td>
                  <td className="p-3 border">{course.batchNumber}</td>
                  <td className="p-3 border">{course.batchName}</td>
                  <td className="p-3 border">{course.courseId.description}</td>
                  <td className="p-3 border">{new Date(course.startDate).toLocaleDateString()}</td>
                  <td className="p-3 border">{course.timings}</td>
                  <td className="p-3 border">{course.duration}</td>
                  <td className="p-3 border">{course.category}</td>
                  <td className="p-3 border">
                    {course.enrolledUsers.map((u) => u.email).join(", ")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  ) : null;
};

export default MentorEnrollments;
