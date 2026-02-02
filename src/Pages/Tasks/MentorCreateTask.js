import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiSave, FiUpload } from "react-icons/fi";

const API_BASE = "https://api.techsterker.com/api";

const MentorCreateTask = () => {
  const mentorId = localStorage.getItem("mentorId");

  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);

  const [form, setForm] = useState({
    enrollmentId: "",
    taskType: "individual",
    userId: "",
    title: "",
    description: "",
    questionType: "text",
    questionText: "",
    questionLink: "",
    questionFiles: null,
    dueDate: "",
  });

  /* ---------------- FETCH BATCHES ---------------- */
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/mentorbatches/${mentorId}`
        );
        setBatches(res.data?.teachingSchedule || []);
      } catch {
        console.error("Failed to fetch batches");
      }
    };
    fetchBatches();
  }, [mentorId]);

  /* ---------------- FETCH STUDENTS (ON BATCH CHANGE) ---------------- */
  useEffect(() => {
    if (!form.enrollmentId || form.taskType !== "individual") {
      setStudents([]);
      return;
    }

    const fetchStudents = async () => {
      setFetchingStudents(true);
      try {
        const res = await axios.get(
          `${API_BASE}/our-mentor/enrollment/${form.enrollmentId}/complete-details`
        );
        setStudents(res.data?.data?.students?.list || []);
      } catch {
        setStudents([]);
      } finally {
        setFetchingStudents(false);
      }
    };

    fetchStudents();
  }, [form.enrollmentId, form.taskType]);

  /* ---------------- HANDLERS ---------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleFileChange = (e) => {
    setForm((p) => ({ ...p, questionFiles: e.target.files }));
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("mentorId", mentorId);
      fd.append("enrollmentId", form.enrollmentId);
      fd.append("taskType", form.taskType);
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("questionType", form.questionType);
      fd.append("dueDate", form.dueDate);

      if (form.taskType === "individual") {
        fd.append("userId", form.userId);
      }

      if (form.questionType === "text") {
        fd.append("questionText", form.questionText);
      }

      if (form.questionType === "link") {
        fd.append("questionLink", form.questionLink);
      }

      if (
        ["pdf", "image", "document"].includes(form.questionType) &&
        form.questionFiles
      ) {
        Array.from(form.questionFiles).forEach((file) =>
          fd.append("questionFiles", file)
        );
      }

      await axios.post(`${API_BASE}/our-mentor/create`, fd);

      alert("✅ Task created successfully");

      setForm({
        enrollmentId: "",
        taskType: "individual",
        userId: "",
        title: "",
        description: "",
        questionType: "text",
        questionText: "",
        questionLink: "",
        questionFiles: null,
        dueDate: "",
      });
    } catch (err) {
      alert("❌ Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-6">
        <h1 className="text-2xl font-bold text-blue-400 mb-6">
          Create Task / Assignment
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* BATCH */}
          <select
            name="enrollmentId"
            value={form.enrollmentId}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-4 py-3"
          >
            <option value="">Select Batch</option>
            {batches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.batchName} ({b.batchNumber})
              </option>
            ))}
          </select>

          {/* TASK TYPE */}
          <select
            name="taskType"
            value={form.taskType}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3"
          >
            <option value="individual">Individual Task</option>
            <option value="batch">Batch Task</option>
          </select>

          {/* STUDENT */}
          {form.taskType === "individual" && (
            <select
              name="userId"
              value={form.userId}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-3"
            >
              <option value="">
                {fetchingStudents ? "Loading students..." : "Select Student"}
              </option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.fullName} ({s.userId})
                </option>
              ))}
            </select>
          )}

          {/* TITLE */}
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Task Title"
            required
            className="w-full border rounded-lg px-4 py-3"
          />

          {/* DESCRIPTION */}
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Task Description"
            rows={3}
            className="w-full border rounded-lg px-4 py-3"
          />

          {/* QUESTION TYPE */}
          <select
            name="questionType"
            value={form.questionType}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3"
          >
            <option value="text">Text</option>
            <option value="pdf">PDF</option>
            <option value="image">Image</option>
            <option value="document">Document</option>
            <option value="link">Link</option>
          </select>

          {/* QUESTION INPUT */}
          {form.questionType === "text" && (
            <textarea
              name="questionText"
              value={form.questionText}
              onChange={handleChange}
              placeholder="Enter question text"
              rows={4}
              className="w-full border rounded-lg px-4 py-3"
            />
          )}

          {form.questionType === "link" && (
            <input
              name="questionLink"
              value={form.questionLink}
              onChange={handleChange}
              placeholder="Paste question link"
              className="w-full border rounded-lg px-4 py-3"
            />
          )}

          {["pdf", "image", "document"].includes(form.questionType) && (
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="w-full"
              />
            </div>
          )}

          {/* DUE DATE */}
          <input
            type="date"
            name="dueDate"
            value={form.dueDate}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-4 py-3"
          />

          {/* SUBMIT */}
          <button
            disabled={loading}
            className="w-full bg-blue-400 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-400"
          >
            <FiSave />
            {loading ? "Creating..." : "Create Task"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MentorCreateTask;
