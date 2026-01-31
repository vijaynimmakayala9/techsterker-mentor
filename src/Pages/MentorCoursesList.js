import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

const API_BASE = "https://api.techsterker.com/api";
const PAGE_SIZES = [5, 10, 20];

// ---------------- CSV UTILS ----------------
const convertToCSV = (arr) => {
  if (!arr.length) return "";
  const headers = Object.keys(arr[0]);
  const rows = [
    headers.join(","),
    ...arr.map((row) =>
      headers
        .map((key) => `"${(row[key] ?? "").toString().replace(/"/g, '""')}"`)
        .join(",")
    ),
  ];
  return rows.join("\n");
};

const downloadCSV = (csv, filename) => {
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

// ---------------- COMPONENT ----------------
const MentorCoursesList = () => {
  const mentorId = localStorage.getItem("mentorId");

  const [courses, setCourses] = useState([]);
  const [mentorName, setMentorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (!mentorId) {
      setError("Mentor not logged in");
      return;
    }
    fetchCourses();
  }, [mentorId]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/mentorenrollments/${mentorId}`);
      setCourses(res.data?.assignedCourses || []);
      setMentorName(res.data?.mentor?.fullName || "Mentor");
    } catch {
      setError("Failed to load mentor courses.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- FILTERING ----------------
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const term = search.toLowerCase();
      const matchesSearch =
        c.batchName?.toLowerCase().includes(term) ||
        c.courseId?.description?.toLowerCase().includes(term) ||
        c.category?.toLowerCase().includes(term);

      const matchesCategory = category ? c.category === category : true;
      const matchesDate = startDate
        ? new Date(c.startDate).toISOString().slice(0, 10) === startDate
        : true;

      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [courses, search, category, startDate]);

  // ---------------- PAGINATION ----------------
  const totalPages = Math.ceil(filteredCourses.length / pageSize);
  const paginatedCourses = filteredCourses.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // ---------------- CSV EXPORT ----------------
  const exportCSV = () => {
    const data = filteredCourses.map((c, i) => ({
      "#": i + 1,
      "Batch Name": c.batchName,
      "Batch Number": c.batchNumber,
      Description: c.courseId?.description,
      Duration: c.duration,
      Price: c.courseId?.price,
      Timings: c.timings,
      "Start Date": c.startDate
        ? new Date(c.startDate).toLocaleDateString()
        : "",
      Category: c.category,
    }));
    downloadCSV(
      convertToCSV(data),
      `${mentorName.replace(/\s/g, "_")}_courses.csv`
    );
  };

  if (loading)
    return <p className="text-center py-10 text-lg">Loading courses…</p>;

  if (error)
    return (
      <div className="text-center py-10">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchCourses}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl shadow-xl">
      <h2 className="text-2xl md:text-3xl font-bold text-blue-900 mb-6">
        👨‍🏫 {mentorName} — Assigned Courses
      </h2>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <input
          className="px-4 py-2 rounded-lg border"
          placeholder="Search course…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="px-4 py-2 rounded-lg border"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {[...new Set(courses.map((c) => c.category))].map(
            (cat) =>
              cat && (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              )
          )}
        </select>

        <input
          type="date"
          className="px-4 py-2 rounded-lg border"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <button
          onClick={exportCSV}
          disabled={!filteredCourses.length}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 disabled:opacity-50"
        >
          Export CSV
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-md">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-600 text-white">
            <tr>
              {[
                "#",
                "Batch",
                "Number",
                "Description",
                "Duration",
                "Price",
                "Timings",
                "Start",
                "Category",
              ].map((h) => (
                <th key={h} className="p-3 text-left whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedCourses.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-6 text-center text-gray-500">
                  No courses found
                </td>
              </tr>
            ) : (
              paginatedCourses.map((c, i) => (
                <tr
                  key={c._id}
                  className="border-b hover:bg-blue-50 transition"
                >
                  <td className="p-3">{(page - 1) * pageSize + i + 1}</td>
                  <td className="p-3 font-medium">{c.batchName}</td>
                  <td className="p-3">{c.batchNumber}</td>
                  <td className="p-3 max-w-xs truncate">
                    {c.courseId?.description}
                  </td>
                  <td className="p-3">{c.duration}</td>
                  <td className="p-3 font-semibold text-green-600">
                    ₹{c.courseId?.price}
                  </td>
                  <td className="p-3">{c.timings}</td>
                  <td className="p-3">
                    {new Date(c.startDate).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">
                      {c.category}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex flex-wrap items-center justify-between mt-6 gap-4">
        <div>
          Page {page} of {totalPages || 1}
        </div>

        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-lg bg-gray-200 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg bg-gray-200 disabled:opacity-40"
          >
            Next
          </button>
        </div>

        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(+e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border rounded-lg"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s} / page
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default MentorCoursesList;
