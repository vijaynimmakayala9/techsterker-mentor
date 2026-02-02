import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiDownload,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

const API_BASE = "https://api.techsterker.com/api/our-mentor";
const PAGE_SIZE = 5;

const MentorAllTasks = () => {
  const mentorId = localStorage.getItem("mentorId");

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);

  const [editTask, setEditTask] = useState(null);

  /* ---------------- FETCH TASKS ---------------- */
  const fetchTasks = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/get/${mentorId}`
      );
      setTasks(res.data?.data || []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  /* ---------------- FILTER + SEARCH ---------------- */
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (typeFilter !== "all" && t.taskType !== typeFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;

      if (!search.trim()) return true;
      const s = search.toLowerCase();

      return (
        t.title.toLowerCase().includes(s) ||
        t.enrollmentId.batchName.toLowerCase().includes(s)
      );
    });
  }, [tasks, search, typeFilter, statusFilter]);

  /* ---------------- PAGINATION ---------------- */
  const totalPages = Math.ceil(filteredTasks.length / PAGE_SIZE);
  const paginated = filteredTasks.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  /* ---------------- EXPORT CSV ---------------- */
  const exportCSV = () => {
    const headers = [
      "Title",
      "Batch",
      "Task Type",
      "Due Date",
      "Status",
    ];

    const rows = filteredTasks.map((t) => [
      t.title,
      t.enrollmentId.batchName,
      t.taskType,
      new Date(t.dueDate).toLocaleDateString(),
      t.status,
    ]);

    const csv =
      headers.join(",") +
      "\n" +
      rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mentor_tasks.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------------- UPDATE TASK ---------------- */
  const handleUpdate = async () => {
    try {
      await axios.put(
        `${API_BASE}/update/${editTask._id}`,
        {
          title: editTask.title,
          description: editTask.description,
          dueDate: editTask.dueDate,
        }
      );
      setEditTask(null);
      fetchTasks();
    } catch {
      alert("Failed to update task");
    }
  };

  /* ---------------- DELETE TASK ---------------- */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    await axios.delete(`${API_BASE}/delete/${id}`);
    fetchTasks();
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">
              Mentor Tasks
            </h1>
            <p className="text-sm text-black">
              Manage all your assignments & tasks
            </p>
          </div>

          <button
            onClick={exportCSV}
            className="bg-blue-400 text-white px-5 py-2 rounded-lg flex items-center gap-2"
          >
            <FiDownload /> Export
          </button>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white rounded-xl shadow p-4 flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or batch..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="all">All Types</option>
            <option value="batch">Batch</option>
            <option value="individual">Individual</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-400 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Batch</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Due</th>
                <th className="px-4 py-3 text-left">Submissions</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((t) => (
                <tr key={t._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{t.title}</td>
                  <td className="px-4 py-3">{t.enrollmentId.batchName}</td>
                  <td className="px-4 py-3 capitalize">{t.taskType}</td>
                  <td className="px-4 py-3">
                    {new Date(t.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {t.submissions.length}
                  </td>
                  <td className="px-4 py-3 flex gap-3">
                    <button
                      onClick={() => setEditTask(t)}
                      className="text-blue-600"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => handleDelete(t._id)}
                      className="text-red-600"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-2 border rounded"
              >
                <FiChevronLeft />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-2 border rounded"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Edit Task</h2>

            <input
              value={editTask.title}
              onChange={(e) =>
                setEditTask({ ...editTask, title: e.target.value })
              }
              className="w-full border rounded p-2 mb-3"
            />

            <textarea
              value={editTask.description}
              onChange={(e) =>
                setEditTask({ ...editTask, description: e.target.value })
              }
              className="w-full border rounded p-2 mb-3"
            />

            <input
              type="date"
              value={editTask.dueDate.slice(0, 10)}
              onChange={(e) =>
                setEditTask({ ...editTask, dueDate: e.target.value })
              }
              className="w-full border rounded p-2 mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditTask(null)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-[#a51d34] text-white rounded"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorAllTasks;
