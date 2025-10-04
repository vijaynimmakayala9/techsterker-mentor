import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { MdEdit, MdDelete } from "react-icons/md";

// Utility to convert array of objects to CSV string
const convertToCSV = (arr) => {
  if (!arr || arr.length === 0) return "";

  const headers = Object.keys(arr[0]);
  const csvRows = [
    headers.join(","), // header row first
    ...arr.map(row =>
      headers
        .map((fieldName) => {
          const escaped = (row[fieldName] || "").toString().replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    ),
  ];
  return csvRows.join("\n");
};

// Utility to trigger CSV download
const downloadCSV = (csv, filename = "live_classes.csv") => {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const API_BASE = "https://api.techsterker.com/api";

const MentorLiveClasses = () => {
  const [classes, setClasses] = useState([]);
  const [mentorName, setMentorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [editForm, setEditForm] = useState({
    className: "",
    subjectName: "",
    date: "",
    timing: "",
    link: "",
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteClass, setDeleteClass] = useState(null);

  const mentorId = localStorage.getItem("mentorId");

  useEffect(() => {
    if (!mentorId) {
      setError("Mentor not logged in.");
      return;
    }
    fetchLiveClasses();
  }, [mentorId]);

  const fetchLiveClasses = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/mentorliveclass/${mentorId}`);
      const data = res.data;

      if (data?.success) {
        setClasses(data.data || []);
        const mentor = data.data?.[0]?.mentorId;
        if (mentor) {
          setMentorName(`${mentor.firstName || ""} ${mentor.lastName || ""}`.trim());
        }
      } else {
        setClasses([]);
        setError("No live classes found for this mentor.");
      }
    } catch (err) {
      console.error("Error fetching live classes:", err);
      setError("Failed to fetch live classes.");
    } finally {
      setLoading(false);
    }
  };

  // Filter classes based on search term
  const filteredClasses = useMemo(() => {
    if (!searchTerm.trim()) return classes;

    const lowerSearch = searchTerm.toLowerCase();
    return classes.filter(
      (cls) =>
        cls.className?.toLowerCase().includes(lowerSearch) ||
        cls.subjectName?.toLowerCase().includes(lowerSearch)
    );
  }, [classes, searchTerm]);

  const handleExportCSV = () => {
    // Prepare data for CSV
    const dataToExport = filteredClasses.map((cls, idx) => ({
      "#": idx + 1,
      "Class Name": cls.className || "",
      "Subject": cls.subjectName || "",
      "Date": cls.date ? new Date(cls.date).toLocaleDateString() : "",
      "Timing": cls.timing || "",
      "Join Link": cls.link || "",
    }));

    const csv = convertToCSV(dataToExport);
    downloadCSV(csv, `${mentorName.replace(/\s+/g, "_")}_live_classes.csv`);
  };

  // Handle Edit button click
  const openEditModal = (cls) => {
    setEditClass(cls);
    setEditForm({
      className: cls.className || "",
      subjectName: cls.subjectName || "",
      date: cls.date ? cls.date.split("T")[0] : "",
      timing: cls.timing || "",
      link: cls.link || "",
    });
    setShowEditModal(true);
  };

  // Handle Edit Form Change
  const handleEditChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Submit Edit Form
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editClass) return;

    const { className, subjectName, date, timing, link } = editForm;
    if (!className || !subjectName || !date || !timing || !link) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.put(`${API_BASE}/liveclass/${editClass._id}`, {
        className,
        subjectName,
        date,
        timing,
        link,
      });
      if (res.data.success) {
        // Update class in list
        setClasses((prev) =>
          prev.map((c) => (c._id === editClass._id ? res.data.data : c))
        );
        setShowEditModal(false);
        setEditClass(null);
      } else {
        alert(res.data.message || "Failed to update class");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating live class");
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete button click
  const openDeleteConfirm = (cls) => {
    setDeleteClass(cls);
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const handleDelete = async () => {
    if (!deleteClass) return;

    try {
      setLoading(true);
      const res = await axios.delete(`${API_BASE}/liveclass/${deleteClass._id}`);
      if (res.data.success) {
        setClasses((prev) => prev.filter((c) => c._id !== deleteClass._id));
        setShowDeleteConfirm(false);
        setDeleteClass(null);
      } else {
        alert(res.data.message || "Failed to delete live class");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting live class");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-lg">Loading live classes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-lg">{error}</p>
        <button
          onClick={fetchLiveClasses}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-blue-900 mb-4 text-center">
        Mentor Live Classes
      </h2>
      {mentorName && (
        <p className="text-center mb-6 text-lg text-gray-700 font-medium">
          Mentor: {mentorName}
        </p>
      )}

      {/* Search and Export Controls */}
      <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by Class Name or Subject"
          className="border border-gray-300 rounded px-4 py-2 w-full max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <button
          onClick={handleExportCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          disabled={filteredClasses.length === 0}
          title={filteredClasses.length === 0 ? "No classes to export" : "Export CSV"}
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-3 border">#</th>
              <th className="p-3 border">Class Name</th>
              <th className="p-3 border">Subject</th>
              <th className="p-3 border">Date</th>
              <th className="p-3 border">Timing</th>
              <th className="p-3 border">Join Link</th>
              <th className="p-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClasses.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  No live classes scheduled.
                </td>
              </tr>
            ) : (
              filteredClasses.map((cls, idx) => (
                <tr key={cls._id} className="border-b hover:bg-gray-50">
                  <td className="p-3 border text-center">{idx + 1}</td>
                  <td className="p-3 border">{cls.className}</td>
                  <td className="p-3 border">{cls.subjectName}</td>
                  <td className="p-3 border">
                    {cls.date
                      ? new Date(cls.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </td>
                  <td className="p-3 border">{cls.timing}</td>
                  <td className="p-3 border text-blue-600 underline text-sm">
                    <a href={cls.link} target="_blank" rel="noopener noreferrer">
                      Join Class
                    </a>
                  </td>
                  <td className="p-3 border flex justify-center space-x-3 text-xl text-blue-600">
                    <button
                      onClick={() => openEditModal(cls)}
                      title="Edit Class"
                      className="hover:text-blue-800"
                    >
                      <MdEdit />
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(cls)}
                      title="Delete Class"
                      className="hover:text-red-600"
                    >
                      <MdDelete />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Edit Live Class</h3>
            <form onSubmit={handleEditSubmit}>
              <label className="block mb-2 font-medium">
                Class Name
                <input
                  type="text"
                  name="className"
                  value={editForm.className}
                  onChange={handleEditChange}
                  className="w-full border p-2 rounded mt-1"
                  required
                />
              </label>

              <label className="block mb-2 font-medium">
                Subject Name
                <input
                  type="text"
                  name="subjectName"
                  value={editForm.subjectName}
                  onChange={handleEditChange}
                  className="w-full border p-2 rounded mt-1"
                  required
                />
              </label>

              <label className="block mb-2 font-medium">
                Date
                <input
                  type="date"
                  name="date"
                  value={editForm.date}
                  onChange={handleEditChange}
                  className="w-full border p-2 rounded mt-1"
                  required
                />
              </label>

              <label className="block mb-2 font-medium">
                Timing
                <input
                  type="text"
                  name="timing"
                  value={editForm.timing}
                  onChange={handleEditChange}
                  placeholder="e.g., 10:00 AM - 11:00 AM"
                  className="w-full border p-2 rounded mt-1"
                  required
                />
              </label>

              <label className="block mb-4 font-medium">
                Join Link
                <input
                  type="url"
                  name="link"
                  value={editForm.link}
                  onChange={handleEditChange}
                  className="w-full border p-2 rounded mt-1"
                  required
                />
              </label>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded border border-gray-400 hover:bg-gray-100"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  disabled={loading}
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-6">
              Are you sure you want to delete{" "}
              <strong>{deleteClass?.className}</strong>?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded border border-gray-400 hover:bg-gray-100"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                disabled={loading}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorLiveClasses;
