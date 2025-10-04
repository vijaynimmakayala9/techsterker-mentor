import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

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

const API_BASE = "https://api.techsterker.com/api";

const MentorUserList = () => {
  const [batchData, setBatchData] = useState([]);
  const [mentorName, setMentorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

  const mentorId = localStorage.getItem("mentorId");

  useEffect(() => {
    if (!mentorId) {
      setError("Mentor not logged in.");
      return;
    }
    fetchUsers();
  }, [mentorId]);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/mentorenrollments/${mentorId}`);
      const data = res.data;

      if (data?.enrolledBatches?.length > 0) {
        setBatchData(data.enrolledBatches);
        setMentorName(data.mentor?.fullName || "Mentor");
      } else {
        setBatchData([]);
        setMentorName(data.mentor?.fullName || "Mentor");
      }
    } catch (err) {
      console.error("Error fetching enrolled users:", err);
      setError("Failed to fetch enrolled users.");
    } finally {
      setLoading(false);
    }
  };

  // Get all unique courses for filter dropdown
  const availableCourses = useMemo(() => {
    const courses = batchData.map(batch => ({
      id: batch.courseId?._id,
      name: batch.batchName || "Unnamed Course",
      batchName: batch.batchName
    }));
    
    // Remove duplicates based on course id
    return courses.filter((course, index, self) => 
      index === self.findIndex(c => c.id === course.id)
    );
  }, [batchData]);

  // Flatten users with their course information
  const allUsersWithCourses = useMemo(() => {
    const usersWithCourses = [];
    
    batchData.forEach(batch => {
      if (batch.enrolledUsers && batch.enrolledUsers.length > 0) {
        batch.enrolledUsers.forEach(user => {
          usersWithCourses.push({
            ...user,
            courseName: batch.batchName || "Unnamed Course",
            courseId: batch.courseId?._id,
            batchNumber: batch.batchNumber,
            startDate: batch.startDate,
            timings: batch.timings,
            duration: batch.duration,
            category: batch.category
          });
        });
      }
    });
    
    return usersWithCourses;
  }, [batchData]);

  // Filter users based on search term and selected course
  const filteredUsers = useMemo(() => {
    let filtered = allUsersWithCourses;

    // Apply course filter
    if (selectedCourse) {
      filtered = filtered.filter(user => user.courseId === selectedCourse);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(lowerSearch) ||
          user.email?.toLowerCase().includes(lowerSearch) ||
          user.mobile?.toLowerCase().includes(lowerSearch) ||
          user.courseName?.toLowerCase().includes(lowerSearch) ||
          user.batchNumber?.toLowerCase().includes(lowerSearch)
      );
    }

    return filtered;
  }, [allUsersWithCourses, searchTerm, selectedCourse]);

  const handleExportCSV = () => {
    // Prepare data for CSV with course information
    const dataToExport = filteredUsers.map((user, idx) => ({
      "#": idx + 1,
      Name: user.name || "",
      Email: user.email || "",
      Mobile: user.mobile || "",
      Course: user.courseName || "",
      "Batch Number": user.batchNumber || "",
      "Start Date": user.startDate ? new Date(user.startDate).toLocaleDateString() : "",
      Timings: user.timings || "",
      Duration: user.duration || "",
      Category: user.category || ""
    }));

    const csv = convertToCSV(dataToExport);
    downloadCSV(csv, `${mentorName.replace(/\s+/g, "_")}_users.csv`);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-lg">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-lg">{error}</p>
        <button
          onClick={fetchUsers}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-semibold text-blue-900 mb-4">
        Mentor: {mentorName}
      </h2>

      {/* Search, Filter and Export Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search by Name, Email, Mobile, Course, or Batch"
            className="border border-gray-300 rounded px-4 py-2 w-full md:w-80"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 w-full md:w-64"
          >
            <option value="">All Courses</option>
            {availableCourses.map(course => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded whitespace-nowrap"
          disabled={filteredUsers.length === 0}
          title={filteredUsers.length === 0 ? "No users to export" : "Export CSV"}
        >
          Export CSV
        </button>
      </div>

      {/* Users Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredUsers.length} user(s)
        {selectedCourse && (
          <span> for {availableCourses.find(c => c.id === selectedCourse)?.name}</span>
        )}
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-3 border">#</th>
              <th className="p-3 border">Name</th>
              <th className="p-3 border">Email</th>
              <th className="p-3 border">Mobile</th>
              <th className="p-3 border">Course</th>
              <th className="p-3 border">Batch Number</th>
              <th className="p-3 border">Start Date</th>
              <th className="p-3 border">Timings</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">
                  No enrolled users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, idx) => (
                <tr key={user._id || idx} className="border-b hover:bg-gray-50">
                  <td className="p-3 border text-center">{idx + 1}</td>
                  <td className="p-3 border">{user.name}</td>
                  <td className="p-3 border">{user.email}</td>
                  <td className="p-3 border">{user.mobile}</td>
                  <td className="p-3 border">{user.courseName}</td>
                  <td className="p-3 border">{user.batchNumber}</td>
                  <td className="p-3 border">
                    {user.startDate ? new Date(user.startDate).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="p-3 border">{user.timings}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MentorUserList;