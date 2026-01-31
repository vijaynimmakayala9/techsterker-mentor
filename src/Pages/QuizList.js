import React, { useState, useEffect } from "react";
import axios from "axios";
import { Edit, Trash2, Eye, Download, X, Plus, Minus, FileText, CheckCircle, Clock, Hash, Award } from "lucide-react";

const API_BASE = "https://api.techsterker.com/api";

const QuizList = ({ onEdit, refreshQuizzes }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  
  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    courseId: "",
    questions: []
  });

  // View Modal States
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingQuiz, setViewingQuiz] = useState(null);
  const [viewCourseDetails, setViewCourseDetails] = useState(null);

  const mentorId = localStorage.getItem("mentorId");

  useEffect(() => {
    if (!mentorId) {
      setError("Mentor not logged in");
      setLoading(false);
      return;
    }
    fetchCourses();
    fetchQuizzes();
  }, [mentorId]);

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API_BASE}/mentorenrollments/${mentorId}`);
      const data = res.data;

      if (data?.assignedCourses?.length > 0) {
        setCourses(data.assignedCourses);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to fetch assigned courses.");
    }
  };

  const fetchQuizzes = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const res = await axios.get(`${API_BASE}/our-mentor/mentorquizz/${mentorId}`);
      const data = res.data;
      
      if (data?.quizzes && Array.isArray(data.quizzes)) {
        setQuizzes(data.quizzes);
        if (data.quizzes.length === 0) {
          setSuccess("No quizzes found. Create your first quiz!");
        }
      } else {
        setQuizzes([]);
        setSuccess("No quizzes found. Create your first quiz!");
      }
    } catch (err) {
      console.error("Error fetching quizzes:", err);
      setError(err.response?.data?.message || "Failed to fetch quizzes. Please try again.");
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = (quiz) => {
    setViewingQuiz(quiz);
    // Find course details for this quiz
    const course = courses.find(c => c._id === quiz.courseId);
    setViewCourseDetails(course);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (quiz) => {
    setEditingQuiz(quiz);
    
    // Convert correctAnswer string to index for editing
    const formattedQuestions = quiz.questions && Array.isArray(quiz.questions) 
      ? quiz.questions.map(q => {
          // Find index of correctAnswer in options array
          const correctAnswerIndex = q.options 
            ? q.options.findIndex(option => option === q.correctAnswer)
            : -1;
          
          return {
            question: q.question || "",
            options: q.options && Array.isArray(q.options) ? [...q.options] : ["", "", "", ""],
            correctAnswer: correctAnswerIndex !== -1 ? correctAnswerIndex.toString() : "",
            points: q.points || 1
          };
        })
      : [];
    
    setEditFormData({
      title: quiz.title || "",
      description: quiz.description || "",
      courseId: quiz.courseId || "",
      questions: formattedQuestions
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingQuiz?._id) {
      setError("No quiz selected for editing");
      return;
    }

    // Validation
    if (!editFormData.title.trim()) {
      setError("Quiz title is required");
      return;
    }

    if (!editFormData.courseId) {
      setError("Please select a course");
      return;
    }

    if (editFormData.questions.length === 0) {
      setError("At least one question is required");
      return;
    }

    // Validate each question
    for (let i = 0; i < editFormData.questions.length; i++) {
      const q = editFormData.questions[i];
      if (!q.question.trim()) {
        setError(`Question ${i + 1} text is required`);
        return;
      }
      if (!q.options || q.options.length < 2) {
        setError(`Question ${i + 1} must have at least 2 options`);
        return;
      }
      // Filter out empty options
      const validOptions = q.options.filter(opt => opt.trim() !== "");
      if (validOptions.length < 2) {
        setError(`Question ${i + 1} must have at least 2 non-empty options`);
        return;
      }
      if (q.correctAnswer === "" || q.correctAnswer === undefined) {
        setError(`Question ${i + 1} must have a correct answer selected`);
        return;
      }
    }

    setEditLoading(true);
    setError("");
    setSuccess("");

    try {
      // Prepare payload - convert correctAnswer from index to actual option text
      const payload = {
        title: editFormData.title.trim(),
        description: editFormData.description.trim(),
        courseId: editFormData.courseId,
        questions: editFormData.questions.map(q => {
          const validOptions = q.options.filter(opt => opt.trim() !== "");
          const correctAnswerIndex = parseInt(q.correctAnswer);
          
          return {
            question: q.question.trim(),
            options: validOptions,
            correctAnswer: validOptions[correctAnswerIndex] || "",
            points: q.points || 1
          };
        }),
        mentorId: mentorId
      };

      const res = await axios.put(
        `${API_BASE}/our-mentor/updatequiz/${editingQuiz._id}`,
        payload
      );

      setSuccess("Quiz updated successfully!");
      setIsEditModalOpen(false);
      setEditingQuiz(null);
      
      // Refresh the list
      fetchQuizzes();
      if (refreshQuizzes) refreshQuizzes();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Error updating quiz:", err);
      setError(err.response?.data?.message || "Failed to update quiz. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/our-mentor/deletequiz/${quizId}/${mentorId}`);
      
      setSuccess("Quiz deleted successfully!");
      setError("");
      
      fetchQuizzes();
      if (refreshQuizzes) refreshQuizzes();
      
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Error deleting quiz:", err);
      setError(err.response?.data?.message || "Failed to delete quiz. Please try again.");
      
      setTimeout(() => {
        setError("");
      }, 5000);
    }
  };

  // Edit Form Handlers
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...editFormData.questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setEditFormData({ ...editFormData, questions: updatedQuestions });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updatedQuestions = [...editFormData.questions];
    updatedQuestions[qIndex].options[oIndex] = value;
    setEditFormData({ ...editFormData, questions: updatedQuestions });
  };

  const addQuestion = () => {
    setEditFormData({
      ...editFormData,
      questions: [
        ...editFormData.questions,
        {
          question: "",
          options: ["", "", "", ""],
          correctAnswer: "",
          points: 1
        }
      ]
    });
  };

  const removeQuestion = (index) => {
    if (editFormData.questions.length <= 1) {
      setError("At least one question is required");
      return;
    }
    const updatedQuestions = editFormData.questions.filter((_, i) => i !== index);
    setEditFormData({ ...editFormData, questions: updatedQuestions });
  };

  const addOption = (qIndex) => {
    const updatedQuestions = [...editFormData.questions];
    updatedQuestions[qIndex].options.push("");
    setEditFormData({ ...editFormData, questions: updatedQuestions });
  };

  const removeOption = (qIndex, oIndex) => {
    const updatedQuestions = [...editFormData.questions];
    const validOptions = updatedQuestions[qIndex].options.filter(opt => opt.trim() !== "");
    
    if (validOptions.length <= 2) {
      setError("At least 2 non-empty options are required");
      return;
    }
    
    // If removing the correct answer, reset it
    if (updatedQuestions[qIndex].correctAnswer === oIndex.toString()) {
      updatedQuestions[qIndex].correctAnswer = "";
    }
    
    // Adjust correctAnswer index if removing an option before it
    if (updatedQuestions[qIndex].correctAnswer && parseInt(updatedQuestions[qIndex].correctAnswer) > oIndex) {
      updatedQuestions[qIndex].correctAnswer = (parseInt(updatedQuestions[qIndex].correctAnswer) - 1).toString();
    }
    
    updatedQuestions[qIndex].options.splice(oIndex, 1);
    setEditFormData({ ...editFormData, questions: updatedQuestions });
  };

  const getCourseName = (courseId) => {
    const course = courses.find((c) => c._id === courseId);
    return course ? course.batchName : "Unknown Course";
  };

  const getCourseDescription = (courseId) => {
    const course = courses.find((c) => c._id === courseId);
    return course?.courseId?.description || "No description available";
  };

  const calculateTotalPoints = (quiz) => {
    if (!quiz.questions || !Array.isArray(quiz.questions)) return 0;
    return quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0);
  };

  const getQuizStatistics = (quiz) => {
    const totalQuestions = quiz.questions?.length || 0;
    const totalPoints = calculateTotalPoints(quiz);
    const avgPointsPerQuestion = totalQuestions > 0 ? (totalPoints / totalQuestions).toFixed(1) : 0;
    
    let easyCount = 0, mediumCount = 0, hardCount = 0;
    quiz.questions?.forEach(q => {
      const points = q.points || 1;
      if (points <= 1) easyCount++;
      else if (points <= 2) mediumCount++;
      else hardCount++;
    });

    return {
      totalQuestions,
      totalPoints,
      avgPointsPerQuestion,
      easyCount,
      mediumCount,
      hardCount
    };
  };

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch = searchTerm === "" || 
      (quiz.title && quiz.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (quiz.description && quiz.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      getCourseName(quiz.courseId).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = selectedCourse === "" || quiz.courseId === selectedCourse;
    
    return matchesSearch && matchesCourse;
  });

  const exportToCSV = () => {
    if (filteredQuizzes.length === 0) return;
    
    const csvData = filteredQuizzes.map((quiz, index) => {
      const course = courses.find(c => c._id === quiz.courseId);
      return {
        "S.No": index + 1,
        "Quiz Title": quiz.title || "N/A",
        "Description": quiz.description || "N/A",
        "Course": course ? course.batchName : "N/A",
        "Course Description": course ? course.courseId?.description || "N/A" : "N/A",
        "Total Questions": quiz.questions?.length || 0,
        "Total Points": calculateTotalPoints(quiz) || 0,
        "Created Date": quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString() : "N/A",
        "Created Time": quiz.createdAt ? new Date(quiz.createdAt).toLocaleTimeString() : "N/A",
      };
    });

    const headers = Object.keys(csvData[0] || {});
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
    a.download = `mentor_quizzes_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to check if an option is the correct answer
  const isCorrectAnswer = (question, option) => {
    return question.correctAnswer === option;
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-lg text-gray-600">Loading quizzes...</div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Quiz Management</h2>
            <p className="text-gray-600 mt-1">View and manage all your created quizzes</p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={fetchQuizzes}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              title="Refresh quizzes list"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Quizzes
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by title, description, or course..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-2.5">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Course
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.batchName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={exportToCSV}
              disabled={filteredQuizzes.length === 0}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              title={filteredQuizzes.length === 0 ? "No quizzes to export" : "Export to CSV"}
            >
              <Download size={18} className="mr-2" />
              Export CSV ({filteredQuizzes.length})
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{quizzes.length}</div>
            <div className="text-sm text-gray-600">Total Quizzes</div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-700">
              {quizzes.reduce((sum, quiz) => sum + (quiz.questions?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Questions</div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-700">
              {quizzes.reduce((sum, quiz) => sum + calculateTotalPoints(quiz), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Points</div>
          </div>
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-700">
              {courses.length}
            </div>
            <div className="text-sm text-gray-600">Assigned Courses</div>
          </div>
        </div>

        {/* Quizzes Table */}
        {filteredQuizzes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Eye size={64} className="mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              {searchTerm || selectedCourse ? "No matching quizzes found" : "No quizzes created yet"}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchTerm || selectedCourse 
                ? "Try adjusting your search or filter criteria" 
                : "Create your first quiz to get started"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quiz Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Questions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredQuizzes.map((quiz, index) => {
                    const stats = getQuizStatistics(quiz);
                    return (
                      <tr key={quiz._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 text-center">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {quiz.title || "Untitled Quiz"}
                            </div>
                            {quiz.description && (
                              <div className="text-sm text-gray-600 mt-1">
                                {quiz.description.length > 100 
                                  ? `${quiz.description.substring(0, 100)}...` 
                                  : quiz.description}
                              </div>
                            )}
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {stats.totalPoints} points
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {stats.totalQuestions} Qs
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getCourseName(quiz.courseId)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {getCourseDescription(quiz.courseId).length > 80 
                                ? `${getCourseDescription(quiz.courseId).substring(0, 80)}...` 
                                : getCourseDescription(quiz.courseId)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {quiz.questions?.length || 0} questions
                            </span>
                            <div className="text-xs text-gray-500">
                              {quiz.questions?.slice(0, 2).map((q, idx) => (
                                <div key={idx} className="truncate" title={q.question}>
                                  {idx + 1}. {q.question && q.question.length > 30 ? `${q.question.substring(0, 30)}...` : q.question || "No question text"}
                                </div>
                              ))}
                              {quiz.questions?.length > 2 && (
                                <div className="text-blue-600">+{quiz.questions.length - 2} more</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(quiz.createdAt)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTime(quiz.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewClick(quiz)}
                              className="text-green-600 hover:text-green-900 p-2 rounded hover:bg-green-50 transition-colors"
                              title="View Quiz Details"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEditClick(quiz)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50 transition-colors"
                              title="Edit Quiz"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(quiz._id)}
                              className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50 transition-colors"
                              title="Delete Quiz"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
              <div>
                Showing <span className="font-medium">{filteredQuizzes.length}</span> of{" "}
                <span className="font-medium">{quizzes.length}</span> quizzes
                {searchTerm && ` matching "${searchTerm}"`}
                {selectedCourse && ` in "${getCourseName(selectedCourse)}"`}
              </div>
              <div className="mt-2 sm:mt-0">
                <button
                  onClick={exportToCSV}
                  disabled={filteredQuizzes.length === 0}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 flex items-center"
                >
                  <Download size={14} className="mr-1" />
                  Download List
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Quiz Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Edit Quiz</h3>
                <p className="text-sm text-gray-600 mt-1">Update quiz details and questions</p>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingQuiz(null);
                  setError("");
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <form onSubmit={handleEditSubmit}>
                {/* Quiz Basic Info */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-700 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quiz Title *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                        placeholder="Enter quiz title"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course *
                      </label>
                      <select
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={editFormData.courseId}
                        onChange={(e) => setEditFormData({...editFormData, courseId: e.target.value})}
                      >
                        <option value="">Select a course</option>
                        {courses.map((course) => (
                          <option key={course._id} value={course._id}>
                            {course.batchName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                      placeholder="Enter quiz description"
                      rows="3"
                    />
                  </div>
                </div>

                {/* Questions Section */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-700">Questions</h4>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center"
                    >
                      <Plus size={16} className="mr-1" />
                      Add Question
                    </button>
                  </div>

                  {editFormData.questions.map((question, qIndex) => (
                    <div key={qIndex} className="mb-6 p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-700 mr-2">
                            Question {qIndex + 1}
                          </span>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 mr-2">Points:</span>
                            <input
                              type="number"
                              min="1"
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                              value={question.points}
                              onChange={(e) => handleQuestionChange(qIndex, 'points', parseInt(e.target.value) || 1)}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIndex)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Remove question"
                        >
                          <Minus size={18} />
                        </button>
                      </div>

                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Question Text *
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={question.question}
                          onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                          placeholder="Enter question text"
                        />
                      </div>

                      {/* Options */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Options * (Mark the correct answer)
                          </label>
                          <button
                            type="button"
                            onClick={() => addOption(qIndex)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            + Add Option
                          </button>
                        </div>
                        
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center mb-2">
                            <input
                              type="radio"
                              name={`correctAnswer-${qIndex}`}
                              checked={question.correctAnswer === oIndex.toString()}
                              onChange={() => handleQuestionChange(qIndex, 'correctAnswer', oIndex.toString())}
                              className="mr-2"
                            />
                            <input
                              type="text"
                              required
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={option}
                              onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                              placeholder={`Option ${oIndex + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => removeOption(qIndex, oIndex)}
                              className="ml-2 text-red-600 hover:text-red-800 p-2"
                              title="Remove option"
                              disabled={question.options.filter(opt => opt.trim() !== "").length <= 2}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingQuiz(null);
                      setError("");
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    disabled={editLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    disabled={editLoading}
                  >
                    {editLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      "Update Quiz"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Quiz Details Modal */}
      {isViewModalOpen && viewingQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                  <FileText className="mr-3 text-blue-600" size={28} />
                  {viewingQuiz.title || "Untitled Quiz"}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Complete quiz details and statistics
                </p>
              </div>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewingQuiz(null);
                  setViewCourseDetails(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Quiz Overview */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="bg-blue-100 p-2 rounded-lg mr-2">
                    <FileText size={20} className="text-blue-600" />
                  </span>
                  Quiz Overview
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center">
                      <Hash size={24} className="text-blue-600 mr-3" />
                      <div>
                        <div className="text-2xl font-bold text-blue-700">
                          {viewingQuiz.questions?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Total Questions</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <Award size={24} className="text-green-600 mr-3" />
                      <div>
                        <div className="text-2xl font-bold text-green-700">
                          {calculateTotalPoints(viewingQuiz)}
                        </div>
                        <div className="text-sm text-gray-600">Total Points</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center">
                      <Clock size={24} className="text-purple-600 mr-3" />
                      <div>
                        <div className="text-2xl font-bold text-purple-700">
                          {viewingQuiz.questions?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Questions</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center">
                      <CheckCircle size={24} className="text-yellow-600 mr-3" />
                      <div>
                        <div className="text-2xl font-bold text-yellow-700">
                          {viewCourseDetails?.batchName ? "Active" : "Inactive"}
                        </div>
                        <div className="text-sm text-gray-600">Status</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quiz Description */}
                {viewingQuiz.description && (
                  <div className="mb-6">
                    <h5 className="text-md font-medium text-gray-700 mb-2">Description</h5>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-gray-700">{viewingQuiz.description}</p>
                    </div>
                  </div>
                )}

                {/* Course Details */}
                <div className="mb-6">
                  <h5 className="text-md font-medium text-gray-700 mb-2">Course Information</h5>
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Course Name:</span>
                        <p className="font-medium">{getCourseName(viewingQuiz.courseId)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Course Description:</span>
                        <p className="font-medium">{getCourseDescription(viewingQuiz.courseId)}</p>
                      </div>
                      {viewCourseDetails?.courseId?.name && (
                        <div>
                          <span className="text-sm text-gray-500">Course Code:</span>
                          <p className="font-medium">{viewCourseDetails.courseId.name}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Creation Details */}
                <div className="mb-8">
                  <h5 className="text-md font-medium text-gray-700 mb-2">Creation Details</h5>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Created Date:</span>
                        <p className="font-medium">{formatDate(viewingQuiz.createdAt)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Created Time:</span>
                        <p className="font-medium">{formatTime(viewingQuiz.createdAt)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Last Updated:</span>
                        <p className="font-medium">
                          {viewingQuiz.updatedAt ? formatDateTime(viewingQuiz.updatedAt) : "Never updated"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Questions Section */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="bg-green-100 p-2 rounded-lg mr-2">
                    <FileText size={20} className="text-green-600" />
                  </span>
                  Questions ({viewingQuiz.questions?.length || 0})
                </h4>
                
                {viewingQuiz.questions && viewingQuiz.questions.length > 0 ? (
                  <div className="space-y-6">
                    {viewingQuiz.questions.map((question, qIndex) => (
                      <div key={qIndex} className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-start">
                            <div className="bg-blue-100 text-blue-800 rounded-lg w-10 h-10 flex items-center justify-center mr-3 font-bold">
                              {qIndex + 1}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-800 mb-2">{question.question}</h5>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                                  Points: {question.points || 1}
                                </span>
                                <span className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded-full">
                                  Question Type: MCQ
                                </span>
                                {question.correctAnswer && (
                                  <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                                    ✓ Correct Answer: {question.correctAnswer}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Options */}
                        <div className="ml-13">
                          <h6 className="text-sm font-medium text-gray-700 mb-3">Options:</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {question.options && question.options.map((option, oIndex) => (
                              <div 
                                key={oIndex} 
                                className={`p-3 rounded-lg border ${
                                  isCorrectAnswer(question, option)
                                    ? 'border-green-500 bg-green-50' 
                                    : 'border-gray-200 bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                                    isCorrectAnswer(question, option)
                                      ? 'bg-green-500 text-white' 
                                      : 'bg-gray-300 text-gray-700'
                                  }`}>
                                    {String.fromCharCode(65 + oIndex)}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-gray-800">{option}</p>
                                  </div>
                                  {isCorrectAnswer(question, option) && (
                                    <CheckCircle size={18} className="text-green-500 ml-2" />
                                  )}
                                </div>
                                {isCorrectAnswer(question, option) && (
                                  <div className="mt-2 text-sm text-green-600 font-medium">
                                    ✓ Correct Answer
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-gray-400 mb-3">
                      <FileText size={48} className="mx-auto opacity-50" />
                    </div>
                    <p className="text-gray-500">No questions found in this quiz</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center p-6 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                Quiz ID: <span className="font-mono text-gray-800">{viewingQuiz._id}</span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    handleEditClick(viewingQuiz);
                    setIsViewModalOpen(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Edit size={18} className="mr-2" />
                  Edit Quiz
                </button>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuizList;