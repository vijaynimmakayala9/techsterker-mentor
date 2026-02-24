import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  MdEdit,
  MdDelete,
  MdUploadFile,
  MdSearch,
  MdRefresh,
  MdDownload,
  MdClose,
  MdCalendarToday,
  MdAccessTime,
  MdLink,
  MdSchool,
  MdBook,
  MdAdd,
  MdFilterList,
  MdVideoLibrary,
  MdPlayCircle,
  MdVideoCall,
  MdCheckCircle
} from "react-icons/md";
import {
  FaChalkboardTeacher,
  FaUsers,
  FaRegCalendarCheck,
  FaExternalLinkAlt,
  FaVideo
} from "react-icons/fa";
import { BsThreeDotsVertical, BsFileEarmarkPdf, BsFilePlay } from "react-icons/bs";
import { InfoIcon, PlusCircle } from "lucide-react";

const API_BASE = "https://api.techsterker.com/api";

const InfoField = ({ label, value }) => (
  <div>
    <p className="text-gray-500 text-xs">{label}</p>
    <div className="bg-white border rounded-lg px-3 py-2 mt-1 truncate">{value}</div>
  </div>
);


const MentorLiveClasses = () => {
  const [classes, setClasses] = useState([]);
  const [mentorName, setMentorName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");

  // Edit Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [editForm, setEditForm] = useState({
    className: "",
    subjectName: "",
    date: "",
    timing: "",
    link: "",
  });

  // Delete Modal States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteClass, setDeleteClass] = useState(null);

  // Upload Material Modal States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadClass, setUploadClass] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Add Class Video Modal States
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoClass, setVideoClass] = useState(null);
  const [videoForm, setVideoForm] = useState({
    title: "",
    description: "",
    videoFile: null,
    mentorId: "",
    courseId: "",
    enrollmentIdRef: "",
    liveClassId: ""
  });
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  // View Materials Modal
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [selectedClassMaterials, setSelectedClassMaterials] = useState([]);
  const [selectedClassName, setSelectedClassName] = useState("");

  // View Videos Modal
  const [showVideosModal, setShowVideosModal] = useState(false);
  const [selectedClassVideos, setSelectedClassVideos] = useState([]);
  const [selectedClassVideosName, setSelectedClassVideosName] = useState("");

  const mentorId = localStorage.getItem("mentorId");

  useEffect(() => {
    if (!mentorId) {
      setError("Please login as mentor to view live classes");
      setLoading(false);
      return;
    }
    fetchLiveClasses();
  }, [mentorId]);

  const fetchLiveClasses = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await axios.get(`${API_BASE}/mentorliveclass/${mentorId}`);
      const data = res.data;

      if (data?.success) {
        setClasses(data.data || []);

        // Extract mentor info from the first class that has mentorId populated
        const firstClassWithMentor = data.data?.find(cls => cls.mentorId && cls.mentorId._id);
        if (firstClassWithMentor?.mentorId) {
          const mentor = firstClassWithMentor.mentorId;
          setMentorName(`${mentor.firstName || ""} ${mentor.lastName || ""}`.trim());
        }

        if (data.data?.length === 0) {
          setSuccess("No live classes scheduled yet. Create your first live class!");
        }
      } else {
        setClasses([]);
        setSuccess("No live classes found. Schedule your first live class!");
      }
    } catch (err) {
      console.error("Error fetching live classes:", err);
      setError(err.response?.data?.message || "Failed to fetch live classes. Please try again.");
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique subjects for filter
  const subjects = useMemo(() => {
    const uniqueSubjects = new Set();
    classes.forEach(cls => {
      if (cls.subjectName) uniqueSubjects.add(cls.subjectName);
    });
    return Array.from(uniqueSubjects);
  }, [classes]);

  // Filter classes based on search and subject
  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      const matchesSearch = searchTerm === "" ||
        (cls.className?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cls.subjectName?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSubject = selectedSubject === "all" || cls.subjectName === selectedSubject;

      return matchesSearch && matchesSubject;
    });
  }, [classes, searchTerm, selectedSubject]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const now = new Date();
    const total = classes.length;
    const upcoming = classes.filter(cls => new Date(cls.date) > now).length;
    const completed = classes.filter(cls => new Date(cls.date) < now).length;

    return { total, upcoming, completed };
  }, [classes]);

  const handleExportCSV = () => {
    if (filteredClasses.length === 0) return;

    const csvData = filteredClasses.map((cls, idx) => ({
      "#": idx + 1,
      "Class Name": cls.className || "",
      "Subject": cls.subjectName || "",
      "Date": cls.date ? new Date(cls.date).toLocaleDateString() : "",
      "Timing": cls.timing || "",
      "Join Link": cls.link || "",
      "Status": new Date(cls.date) > new Date() ? "Upcoming" : "Completed",
      "Course": cls.enrollmentIdRef?.courseId?.name || cls.enrollmentIdRef?.batchName || "N/A",
      "Batch": cls.enrollmentIdRef?.batchNumber || "N/A",
      "Videos": cls.videos?.length || 0,
      "Materials": cls.materials?.length || 0
    }));

    const headers = Object.keys(csvData[0]);
    const csvRows = [
      headers.join(","),
      ...csvData.map(row =>
        headers.map(header => {
          const value = row[header];
          const escapedValue = String(value || '').replace(/"/g, '""');
          return `"${escapedValue}"`;
        }).join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mentorName.replace(/\s+/g, "_")}_live_classes_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSuccess(`Exported ${filteredClasses.length} classes to CSV`);
    setTimeout(() => setSuccess(""), 3000);
  };

  const closeVideoModal = () => {
    setShowVideoModal(false);
    setVideoClass(null);
    setVideoForm({
      title: "",
      description: "",
      videoFile: null,
      mentorId: "",
      courseId: "",
      enrollmentIdRef: "",
      liveClassId: ""
    });
  };

  // ------------------- Edit Logic -------------------
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

  const handleEditChange = (e) => {
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editClass) return;

    const { className, subjectName, date, timing, link } = editForm;
    if (!className || !subjectName || !date || !timing || !link) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.put(`${API_BASE}/liveclass/${editClass._id}`, {
        className, subjectName, date, timing, link
      });

      if (res.data.success) {
        setClasses(prev => prev.map(c => c._id === editClass._id ? res.data.data : c));
        setSuccess("Live class updated successfully!");
        setShowEditModal(false);
        setEditClass(null);

        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(res.data.message || "Failed to update class");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error updating live class");
    } finally {
      setLoading(false);
    }
  };

  // ------------------- Delete Logic -------------------
  const openDeleteConfirm = (cls) => {
    setDeleteClass(cls);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteClass) return;

    setLoading(true);
    try {
      const res = await axios.delete(`${API_BASE}/liveclass/${deleteClass._id}`);
      if (res.data.success) {
        setClasses(prev => prev.filter(c => c._id !== deleteClass._id));
        setSuccess("Live class deleted successfully!");
        setShowDeleteConfirm(false);
        setDeleteClass(null);

        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(res.data.message || "Failed to delete live class");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error deleting live class");
    } finally {
      setLoading(false);
    }
  };

  // ------------------- Upload Material Logic -------------------
  const openUploadModal = (cls) => {
    setUploadClass(cls);
    setShowUploadModal(true);
    setSelectedFile(null);
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0] || null);
  };

  const handleUploadMaterial = async () => {
    if (!uploadClass || !selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("material", selectedFile);

      console.log("Uploading file:", selectedFile.name);
      console.log("File size:", selectedFile.size);
      console.log("File type:", selectedFile.type);

      const res = await axios.post(
        `${API_BASE}/upload-material/${mentorId}/${uploadClass._id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 60000
        }
      );

      console.log("Upload response:", res.data);

      if (res.data.success) {
        setSuccess("Material uploaded successfully!");

        setClasses(prev => prev.map(c => {
          if (c._id === uploadClass._id) {
            return {
              ...c,
              materials: [...(c.materials || []), {
                fileName: res.data.uploadedFile.fileName,
                fileUrl: res.data.uploadedFile.fileUrl,
                uploadedAt: new Date().toISOString()
              }]
            };
          }
          return c;
        }));

        setShowUploadModal(false);
        setUploadClass(null);
        setSelectedFile(null);

        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(res.data.message || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      console.error("Error response:", err.response?.data);

      if (err.code === 'ECONNABORTED') {
        setError("Upload timed out. Please try again with a smaller file.");
      } else if (err.response?.data?.message) {
        setError(`Upload failed: ${err.response.data.message}`);
      } else if (err.message.includes("Network Error")) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("Error uploading material. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  // ------------------- Add Class Video Logic -------------------
  const openVideoModal = (cls) => {
    // Extract mentor ID from the class data
    const classMentorId = cls.mentorId?._id || mentorId;

    // Extract course ID and enrollment ID from enrollmentIdRef
    const courseId = cls.enrollmentIdRef?.courseId?._id || "";
    const enrollmentIdRef = cls.enrollmentIdRef?._id || "";

    setVideoClass(cls);
    setVideoForm({
      title: "",
      description: "",
      videoFile: null,
      mentorId: classMentorId,
      courseId: courseId,
      enrollmentIdRef: enrollmentIdRef,
      liveClassId: cls._id
    });
    setShowVideoModal(true);
    setVideoProgress(0);
  };

  const handleVideoFormChange = (e) => {
    const { name, value } = e.target;
    setVideoForm(prev => ({ ...prev, [name]: value }));
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0] || null;
    setVideoForm(prev => ({ ...prev, videoFile: file }));

    // Auto-populate title from filename if empty
    if (file && !videoForm.title) {
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      setVideoForm(prev => ({ ...prev, title: fileName }));
    }
  };

  const handleUploadVideo = async () => {
    if (!videoClass || !videoForm.videoFile) {
      setError("Please select a video file to upload");
      return;
    }

    if (!videoForm.title) {
      setError("Please enter a video title");
      return;
    }

    setUploadingVideo(true);
    setError("");
    setVideoProgress(0);

    try {
      const formData = new FormData();
      formData.append("video", videoForm.videoFile);
      formData.append("title", videoForm.title);
      formData.append("description", videoForm.description || "");
      formData.append("mentorId", videoForm.mentorId);
      formData.append("liveClassId", videoForm.liveClassId);

      // Add courseId and enrollmentIdRef if they exist
      if (videoForm.courseId) {
        formData.append("courseId", videoForm.courseId);
      }

      if (videoForm.enrollmentIdRef) {
        formData.append("enrollmentIdRef", videoForm.enrollmentIdRef);
      }

      console.log("Uploading video with data:", {
        title: videoForm.title,
        description: videoForm.description,
        mentorId: videoForm.mentorId,
        liveClassId: videoForm.liveClassId,
        courseId: videoForm.courseId || "Not provided",
        enrollmentIdRef: videoForm.enrollmentIdRef || "Not provided",
        fileName: videoForm.videoFile.name,
        fileSize: videoForm.videoFile.size,
        fileType: videoForm.videoFile.type
      });

      const res = await axios.post(
        `${API_BASE}/addliveclassvideo`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 120000, // 2 minutes timeout for video uploads
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setVideoProgress(percentCompleted);
          }
        }
      );

      console.log("Video upload response:", res.data);

      if (res.data.success) {
        setSuccess("Video uploaded successfully!");

        // Update the class with new video
        setClasses(prev => prev.map(c => {
          if (c._id === videoClass._id) {
            const newVideo = {
              title: videoForm.title,
              description: videoForm.description,
              videoUrl: res.data.videoUrl || res.data.fileUrl,
              fileName: videoForm.videoFile.name,
              uploadedAt: new Date().toISOString(),
              ...(res.data.videoData || {})
            };

            return {
              ...c,
              videos: [...(c.videos || []), newVideo]
            };
          }
          return c;
        }));

        setShowVideoModal(false);
        setVideoClass(null);
        setVideoForm({
          title: "",
          description: "",
          videoFile: null,
          mentorId: "",
          courseId: "",
          enrollmentIdRef: "",
          liveClassId: ""
        });

        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(res.data.message || "Video upload failed");
      }
    } catch (err) {
      console.error("Video upload error:", err);
      console.error("Error response:", err.response?.data);

      if (err.code === 'ECONNABORTED') {
        setError("Upload timed out. Please try again with a smaller video file.");
      } else if (err.response?.data?.message) {
        setError(`Upload failed: ${err.response.data.message}`);
      } else if (err.message.includes("Network Error")) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("Error uploading video. Please try again.");
      }
    } finally {
      setUploadingVideo(false);
      setVideoProgress(0);
    }
  };

  // ------------------- View Materials Logic -------------------
  const openMaterialsModal = (cls) => {
    setSelectedClassMaterials(cls.materials || []);
    setSelectedClassName(cls.className);
    setShowMaterialsModal(true);
  };

  // ------------------- View Videos Logic -------------------
  const openVideosModal = (cls) => {
    setSelectedClassVideos(cls.videos || []);
    setSelectedClassVideosName(cls.className);
    setShowVideosModal(true);
  };

  // Format date nicely
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if class is upcoming
  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date();
  };

  // Get enrollment/batch info display
  const getBatchInfo = (cls) => {
    if (cls.enrollmentIdRef) {
      return {
        batchNumber: cls.enrollmentIdRef.batchNumber || "N/A",
        batchName: cls.enrollmentIdRef.batchName || "N/A",
        courseName: cls.enrollmentIdRef.courseId?.name || "N/A"
      };
    }
    return null;
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-lg text-gray-600">Loading live classes...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center mb-2">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mr-4">
              <FaChalkboardTeacher className="text-white text-2xl" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Live Classes Management</h2>
              <p className="text-gray-600 mt-1">Schedule and manage your live teaching sessions</p>
            </div>
          </div>

          {mentorName && (
            <div className="flex items-center mt-2 text-gray-700">
              <FaUsers className="mr-2 text-blue-500" />
              <span className="font-medium">Mentor:</span>
              <span className="ml-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {mentorName}
              </span>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={fetchLiveClasses}
            className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all flex items-center shadow-md hover:shadow-lg"
            title="Refresh classes"
          >
            <MdRefresh className="mr-2 text-lg" />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filteredClasses.length === 0}
            className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all flex items-center shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            title={filteredClasses.length === 0 ? "No classes to export" : "Export to CSV"}
          >
            <MdDownload className="mr-2 text-lg" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-100 border-l-4 border-green-500 text-green-800 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-medium">{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-100 border-l-4 border-red-500 text-red-800 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg mr-3">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-700">{statistics.total}</div>
              <div className="text-gray-600 mt-1">Total Classes</div>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <MdVideoLibrary className="text-3xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-green-700">{statistics.upcoming}</div>
              <div className="text-gray-600 mt-1">Upcoming Classes</div>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <FaRegCalendarCheck className="text-3xl text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-purple-700">{statistics.completed}</div>
              <div className="text-gray-600 mt-1">Completed Classes</div>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <MdCalendarToday className="text-3xl text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Classes</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by class name or subject..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-4 top-3.5">
              <MdSearch className="text-2xl text-gray-400" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Subject</label>
          <div className="relative">
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-10"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject, index) => (
                <option key={index} value={subject}>{subject}</option>
              ))}
            </select>
            <div className="absolute right-4 top-3.5 pointer-events-none">
              <MdFilterList className="text-2xl text-gray-400" />
            </div>
          </div>
        </div>

        <div className="flex items-end">
          <div className="text-sm text-gray-600">
            Showing <span className="font-bold text-blue-600">{filteredClasses.length}</span> of{" "}
            <span className="font-bold">{classes.length}</span> classes
          </div>
        </div>
      </div>

      {/* Classes Table */}
      {filteredClasses.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-2xl">
          <div className="text-gray-400 mb-4">
            <MdVideoLibrary className="text-8xl mx-auto opacity-50" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-600 mb-3">
            {searchTerm || selectedSubject !== "all" ? "No matching classes found" : "No live classes scheduled"}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            {searchTerm || selectedSubject !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Schedule your first live class to get started"}
          </p>
          <button
            onClick={() => {/* Add create class functionality */ }}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all flex items-center mx-auto shadow-md"
          >
            <MdAdd className="mr-2 text-xl" />
            Schedule New Class
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    S NO
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Class Details
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Batch/Course
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Join Link
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Add Video
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredClasses.map((cls, index) => {
                  const batchInfo = getBatchInfo(cls);
                  return (
                    <tr key={cls._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{index + 1}</div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div>
                          <div className="flex items-center mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                              <MdSchool className="text-blue-600" />
                            </div>
                            <div className="font-bold text-gray-800 text-lg">{cls.className}</div>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <MdBook className="mr-2" />
                            <span className="font-medium">{cls.subjectName}</span>
                          </div>

                          {/* Videos and Materials Count */}
                          <div className="flex space-x-3 mt-2">
                            {(cls.videos && cls.videos.length > 0) && (
                              <button
                                onClick={() => openVideosModal(cls)}
                                className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
                              >
                                <FaVideo className="mr-1" />
                                {cls.videos.length} video(s)
                              </button>
                            )}

                            {(cls.materials && cls.materials.length > 0) && (
                              <button
                                onClick={() => openMaterialsModal(cls)}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                              >
                                <BsFileEarmarkPdf className="mr-1" />
                                {cls.materials.length} material(s)
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        {batchInfo ? (
                          <div className="space-y-1">
                            {batchInfo.courseName !== "N/A" && (
                              <div className="text-sm font-medium text-gray-800">
                                Course: {batchInfo.courseName}
                              </div>
                            )}
                            {batchInfo.batchName !== "N/A" && (
                              <div className="text-sm text-gray-600">
                                Batch: {batchInfo.batchName}
                              </div>
                            )}
                            {batchInfo.batchNumber !== "N/A" && (
                              <div className="text-xs text-gray-500">
                                {batchInfo.batchNumber}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No batch assigned</span>
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <MdCalendarToday className="mr-2 text-gray-500" />
                            <span className="font-medium">{formatDate(cls.date)}</span>
                          </div>
                          <div className="flex items-center">
                            <MdAccessTime className="mr-2 text-gray-500" />
                            <span className="text-gray-700">{cls.timing}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <a
                          href={cls.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-medium"
                        >
                          <MdLink className="mr-2" />
                          Join Class
                          <FaExternalLinkAlt className="ml-2 text-sm" />
                        </a>
                      </td>
                      <td className="px-8 py-5">
                        <div className={`px-4 py-2 rounded-full text-sm font-bold text-center ${isUpcoming(cls.date)
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}>
                          {isUpcoming(cls.date) ? 'Upcoming' : 'Completed'}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex space-x-2">

                          {cls.isVideoUploaded ? (
                            // ✅ Already uploaded badge
                            <span className="px-3 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-semibold flex items-center gap-1">
                              <MdCheckCircle className="text-lg" />
                              Uploaded
                            </span>
                          ) : (
                            // ⬆ Upload button
                            <button
                              onClick={() => openVideoModal(cls)}
                              className="p-3 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-colors"
                              title="Upload Class Video"
                            >
                              <MdVideoCall className="text-xl" />
                            </button>
                          )}

                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(cls)}
                            className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                            title="Edit Class"
                          >
                            <MdEdit />
                          </button>
                          <button
                            onClick={() => openUploadModal(cls)}
                            className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
                            title="Upload Material"
                          >
                            <MdUploadFile />
                          </button>
                          <button
                            onClick={() => openDeleteConfirm(cls)}
                            className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                            title="Delete Class"
                          >
                            <MdDelete />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Footer */}
          <div className="mt-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
            <div>
              Showing <span className="font-bold">{filteredClasses.length}</span> classes
              {searchTerm && ` matching "${searchTerm}"`}
              {selectedSubject !== "all" && ` in "${selectedSubject}"`}
            </div>
            <div className="mt-2 md:mt-0">
              <button
                onClick={handleExportCSV}
                disabled={filteredClasses.length === 0}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 flex items-center transition-colors"
              >
                <MdDownload className="mr-2" />
                Export Results
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Class Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <MdEdit className="text-blue-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Edit Live Class</h3>
                  <p className="text-sm text-gray-600">Update class details</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
              >
                <MdClose className="text-2xl" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    name="className"
                    value={editForm.className}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter class name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    name="subjectName"
                    value={editForm.subjectName}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter subject name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={editForm.date}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timing *
                    </label>
                    <input
                      type="text"
                      name="timing"
                      value={editForm.timing}
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="10:00 AM - 11:00 AM"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Join Link *
                  </label>
                  <input
                    type="url"
                    name="link"
                    value={editForm.link}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://meet.google.com/xxx-xxx-xxx"
                    required
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deleteClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <MdDelete className="text-3xl text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Delete Class</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-bold text-red-600">{deleteClass.className}</span>? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all"
                  disabled={loading}
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Material Modal */}
      {showUploadModal && uploadClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <MdUploadFile className="text-green-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Upload Material</h3>
                  <p className="text-sm text-gray-600">For: {uploadClass.className}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadClass(null);
                  setSelectedFile(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
              >
                <MdClose className="text-2xl" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select File (PDF, PPT, DOC, Images)
                </label>

                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.txt"
                />

                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${selectedFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-500'
                    }`}>
                    <MdUploadFile className={`text-4xl mx-auto mb-3 ${selectedFile ? 'text-green-500' : 'text-gray-400'
                      }`} />

                    {selectedFile ? (
                      <div>
                        <p className="text-green-600 font-medium mb-2">✓ File Selected</p>
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-gray-800 font-medium truncate">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <p className="text-sm text-gray-500">Type: {selectedFile.type || "Unknown"}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-600 mb-2">Click to select a file</p>
                        <p className="text-sm text-gray-500">
                          Supports: PDF, PPT, Word, Images
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Maximum file size: 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </label>

                {/* File size validation */}
                {selectedFile && selectedFile.size > 10 * 1024 * 1024 && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">
                      File size ({Math.round(selectedFile.size / 1024 / 1024)}MB) exceeds 10MB limit.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadClass(null);
                    setSelectedFile(null);
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUploadMaterial}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50"
                  disabled={uploading || !selectedFile || (selectedFile && selectedFile.size > 10 * 1024 * 1024)}
                >
                  {uploading ? (
                    <div className="flex items-center">
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      Uploading...
                    </div>
                  ) : (
                    "Upload Material"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Class Video Modal */}
      {showVideoModal && videoClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">

          {/* MODAL */}
          <div className="w-full max-w-2xl max-h-[95vh] bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden animate-scaleIn">

            {/* HEADER */}
            <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 p-6 flex justify-between items-start">
              <div className="flex gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <MdVideoCall className="text-white text-2xl" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">Upload Class Video</h3>
                  <p className="text-purple-200 text-sm">{videoClass.className}</p>
                </div>
              </div>

              <button
                onClick={closeVideoModal}
                className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/20"
              >
                <MdClose className="text-2xl" />
              </button>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* TITLE */}
              <div>
                <label className="font-semibold text-gray-700 text-sm">Video Title *</label>
                <input
                  type="text"
                  name="title"
                  value={videoForm.title}
                  onChange={handleVideoFormChange}
                  placeholder="React Basics - Chapter 1"
                  className="mt-2 w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="font-semibold text-gray-700 text-sm">Description</label>
                <textarea
                  rows="3"
                  name="description"
                  value={videoForm.description}
                  onChange={handleVideoFormChange}
                  className="mt-2 w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* AUTO FILLED DATA */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-2xl border">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                  <MdSchool className="mr-2 text-purple-600" />
                  Auto-filled Information
                </h4>

                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <InfoField label="Mentor ID" value={videoForm.mentorId} />
                  <InfoField label="Live Class ID" value={videoForm.liveClassId} />
                  <InfoField label="Course ID" value={videoForm.courseId} />
                  <InfoField label="Enrollment ID" value={videoForm.enrollmentIdRef} />
                </div>
              </div>

              {/* FILE UPLOAD */}
              <div>
                <label className="font-semibold text-gray-700 text-sm">Upload Video *</label>

                <input type="file" id="video-upload" className="hidden" onChange={handleVideoFileChange} />

                <label htmlFor="video-upload" className="cursor-pointer block mt-3">
                  <div className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${videoForm.videoFile ? "border-purple-500 bg-purple-50" : "border-gray-300 hover:border-purple-500 hover:bg-gray-50"
                    }`}>
                    <MdVideoCall className="text-5xl mx-auto mb-3 text-purple-500" />

                    {videoForm.videoFile ? (
                      <>
                        <p className="font-semibold text-purple-600">{videoForm.videoFile.name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {(videoForm.videoFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-gray-600">Click to upload video</p>
                        <p className="text-xs text-gray-400">MP4, MOV, AVI, MKV</p>
                      </>
                    )}
                  </div>
                </label>

                {/* FILE SIZE WARNING */}
                {videoForm.videoFile && videoForm.videoFile.size > 100 * 1024 * 1024 && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                    Large file. Upload may take longer.
                  </div>
                )}
              </div>

              {/* PROGRESS */}
              {uploadingVideo && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Uploading...</span>
                    <span>{videoProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div style={{ width: `${videoProgress}%` }}
                      className="h-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full" />
                  </div>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="p-5 border-t flex flex-col sm:flex-row justify-end gap-3">
              <button onClick={closeVideoModal} className="px-6 py-3 rounded-xl border hover:bg-gray-50">
                Cancel
              </button>

              <button
                onClick={handleUploadVideo}
                disabled={!videoForm.videoFile || !videoForm.title}
                className="px-6 py-3 text-white rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:shadow-lg disabled:opacity-50"
              >
                {uploadingVideo ? "Uploading..." : "Upload Video"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* View Materials Modal */}
      {showMaterialsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-xl mr-4">
                  <BsFileEarmarkPdf className="text-blue-600 text-2xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Class Materials</h3>
                  <p className="text-sm text-gray-600">{selectedClassName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowMaterialsModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
              >
                <MdClose className="text-2xl" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedClassMaterials.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <MdUploadFile className="text-6xl mx-auto opacity-50" />
                  </div>
                  <p className="text-gray-600">No materials uploaded for this class yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedClassMaterials.map((material, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg mr-4">
                          <BsFileEarmarkPdf className="text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{material.fileName || "Material"}</div>
                          <div className="text-sm text-gray-500">
                            Uploaded on: {new Date(material.uploadedAt || Date.now()).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <a
                        href={material.fileUrl || material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center"
                      >
                        <MdDownload className="mr-2" />
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t">
              <button
                onClick={() => setShowMaterialsModal(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Videos Modal */}
      {showVideosModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-xl mr-4">
                  <FaVideo className="text-purple-600 text-2xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Class Videos</h3>
                  <p className="text-sm text-gray-600">{selectedClassVideosName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowVideosModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
              >
                <MdClose className="text-2xl" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedClassVideos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <FaVideo className="text-6xl mx-auto opacity-50" />
                  </div>
                  <p className="text-gray-600">No videos uploaded for this class yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedClassVideos.map((video, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="p-3 bg-purple-100 rounded-lg mr-4">
                            <MdPlayCircle className="text-purple-600 text-xl" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-800">{video.title || "Untitled Video"}</div>
                            {video.description && (
                              <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              Uploaded on: {new Date(video.uploadedAt || Date.now()).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <a
                          href={video.videoUrl || video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 flex items-center"
                        >
                          <MdPlayCircle className="mr-2" />
                          Watch
                        </a>
                      </div>
                      {video.fileName && (
                        <div className="text-xs text-gray-500 ml-16">
                          File: {video.fileName}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t">
              <button
                onClick={() => setShowVideosModal(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorLiveClasses;