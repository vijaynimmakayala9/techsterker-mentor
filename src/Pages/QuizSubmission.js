import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Download, 
  Eye, 
  Filter, 
  Search, 
  X, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Award, 
  TrendingUp, 
  Users, 
  FileText,
  Calendar,
  BarChart3,
  Percent,
  Hash,
  ChevronDown,
  ChevronUp,
  Copy,
  User,
  BookOpen
} from "lucide-react";

const API_BASE = "https://api.techsterker.com/api";

const QuizSubmission = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [scoreRange, setScoreRange] = useState({ min: 0, max: 100 });
  const [statusFilter, setStatusFilter] = useState("all"); // all, passed, failed
  
  // View modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  
  // Analytics states
  const [analytics, setAnalytics] = useState({
    totalSubmissions: 0,
    averageScore: 0,
    passRate: 0,
    totalStudents: 0,
    totalQuizzes: 0,
    completionRate: 0
  });

  // Grouped submissions by quiz
  const [groupedByQuiz, setGroupedByQuiz] = useState({});
  
  const mentorId = localStorage.getItem("mentorId");

  useEffect(() => {
    if (!mentorId) {
      setError("Mentor not logged in");
      setLoading(false);
      return;
    }
    fetchSubmissions();
  }, [mentorId]);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const res = await axios.get(`${API_BASE}/our-mentor/mentor-submissions/${mentorId}`);
      const data = res.data;
      
      if (data?.success && Array.isArray(data.submissions)) {
        setSubmissions(data.submissions);
        calculateAnalytics(data.submissions);
        groupSubmissionsByQuiz(data.submissions);
        
        if (data.submissions.length === 0) {
          setSuccess("No quiz submissions found yet.");
        }
      } else {
        setSubmissions([]);
        setSuccess("No quiz submissions found yet.");
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setError(err.response?.data?.message || "Failed to fetch submissions. Please try again.");
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (submissionsList) => {
    if (!submissionsList || submissionsList.length === 0) {
      setAnalytics({
        totalSubmissions: 0,
        averageScore: 0,
        passRate: 0,
        totalStudents: 0,
        totalQuizzes: 0,
        completionRate: 0
      });
      return;
    }

    const totalSubmissions = submissionsList.length;
    const totalScore = submissionsList.reduce((sum, sub) => sum + (sub.percentage || 0), 0);
    const averageScore = totalSubmissions > 0 ? totalScore / totalSubmissions : 0;
    
    // Count passed submissions (assuming 60% as passing)
    const passedCount = submissionsList.filter(sub => (sub.percentage || 0) >= 60).length;
    const passRate = totalSubmissions > 0 ? (passedCount / totalSubmissions) * 100 : 0;
    
    // Count unique students
    const uniqueStudents = new Set(submissionsList.map(sub => sub.studentId?._id)).size;
    
    // Count unique quizzes
    const uniqueQuizzes = new Set(submissionsList.map(sub => sub.quizId?._id)).size;
    
    setAnalytics({
      totalSubmissions,
      averageScore: Math.round(averageScore * 10) / 10,
      passRate: Math.round(passRate * 10) / 10,
      totalStudents: uniqueStudents,
      totalQuizzes: uniqueQuizzes,
      completionRate: 100 // This could be calculated based on total students enrolled
    });
  };

  const groupSubmissionsByQuiz = (submissionsList) => {
    const grouped = {};
    submissionsList.forEach(sub => {
      const quizId = sub.quizId?._id;
      if (quizId) {
        if (!grouped[quizId]) {
          grouped[quizId] = {
            quiz: sub.quizId,
            submissions: []
          };
        }
        grouped[quizId].submissions.push(sub);
      }
    });
    setGroupedByQuiz(grouped);
  };

  const handleViewDetails = (submission) => {
    setViewingSubmission(submission);
    setIsViewModalOpen(true);
  };

  const toggleQuestionExpansion = (questionId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 80) return "bg-green-100 text-green-800";
    if (percentage >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getStatusText = (percentage) => {
    if (percentage >= 80) return "Excellent";
    if (percentage >= 60) return "Pass";
    return "Fail";
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

  const filterSubmissions = () => {
    return submissions.filter(sub => {
      // Search filter
      const matchesSearch = searchTerm === "" || 
        (sub.quizId?.title && sub.quizId.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sub.studentId?.name && sub.studentId.name.toLowerCase().includes(searchTerm.toLowerCase()));

      // Course filter
      const matchesCourse = selectedCourse === "" || sub.courseId === selectedCourse;

      // Date range filter
      let matchesDate = true;
      if (dateRange.start) {
        const startDate = new Date(dateRange.start);
        const subDate = new Date(sub.submittedAt || sub.createdAt);
        if (subDate < startDate) matchesDate = false;
      }
      if (dateRange.end) {
        const endDate = new Date(dateRange.end + 'T23:59:59');
        const subDate = new Date(sub.submittedAt || sub.createdAt);
        if (subDate > endDate) matchesDate = false;
      }

      // Score filter
      const matchesScore = (sub.percentage || 0) >= scoreRange.min && 
                         (sub.percentage || 0) <= scoreRange.max;

      // Status filter
      let matchesStatus = true;
      if (statusFilter === "passed") {
        matchesStatus = (sub.percentage || 0) >= 60;
      } else if (statusFilter === "failed") {
        matchesStatus = (sub.percentage || 0) < 60;
      }

      return matchesSearch && matchesCourse && matchesDate && matchesScore && matchesStatus;
    });
  };

  const exportToCSV = () => {
    const filtered = filterSubmissions();
    if (filtered.length === 0) return;
    
    const csvData = filtered.map((sub, index) => {
      return {
        "S.No": index + 1,
        "Quiz Title": sub.quizId?.title || "N/A",
        "Student Name": sub.studentId?.name || "N/A",
        "Score": `${sub.score || 0}/${sub.totalPossiblePoints || 0}`,
        "Percentage": `${sub.percentage || 0}%`,
        "Correct Answers": sub.correctCount || 0,
        "Incorrect Answers": sub.incorrectCount || 0,
        "Unanswered": sub.unansweredCount || 0,
        "Status": getStatusText(sub.percentage || 0),
        "Submitted At": formatDateTime(sub.submittedAt),
        "Submission ID": sub._id || "N/A",
        "Course ID": sub.courseId || "N/A"
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
    a.download = `quiz_submissions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copySubmissionId = (id) => {
    navigator.clipboard.writeText(id);
    setSuccess("Submission ID copied to clipboard!");
    setTimeout(() => setSuccess(""), 2000);
  };

  const getScoreDistribution = () => {
    const scores = submissions.map(sub => sub.percentage || 0);
    const ranges = [
      { label: "0-20%", min: 0, max: 20, color: "bg-red-500" },
      { label: "21-40%", min: 21, max: 40, color: "bg-orange-500" },
      { label: "41-60%", min: 41, max: 60, color: "bg-yellow-500" },
      { label: "61-80%", min: 61, max: 80, color: "bg-blue-500" },
      { label: "81-100%", min: 81, max: 100, color: "bg-green-500" }
    ];

    const distribution = ranges.map(range => {
      const count = scores.filter(score => score >= range.min && score <= range.max).length;
      const percentage = submissions.length > 0 ? (count / submissions.length) * 100 : 0;
      return { ...range, count, percentage };
    });

    return distribution;
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-lg text-gray-600">Loading submissions...</div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Quiz Submissions</h2>
            <p className="text-gray-600 mt-1">Track and analyze student quiz performance</p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={fetchSubmissions}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              title="Refresh submissions"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              disabled={submissions.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              title={submissions.length === 0 ? "No submissions to export" : "Export to CSV"}
            >
              <Download size={18} className="mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm">{success}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <FileText className="text-blue-600 mr-3" size={24} />
              <div>
                <div className="text-2xl font-bold text-blue-700">{analytics.totalSubmissions}</div>
                <div className="text-sm text-gray-600">Total Submissions</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <TrendingUp className="text-green-600 mr-3" size={24} />
              <div>
                <div className="text-2xl font-bold text-green-700">{analytics.averageScore}%</div>
                <div className="text-sm text-gray-600">Average Score</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <Percent className="text-purple-600 mr-3" size={24} />
              <div>
                <div className="text-2xl font-bold text-purple-700">{analytics.passRate}%</div>
                <div className="text-sm text-gray-600">Pass Rate</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center">
              <Users className="text-yellow-600 mr-3" size={24} />
              <div>
                <div className="text-2xl font-bold text-yellow-700">{analytics.totalStudents}</div>
                <div className="text-sm text-gray-600">Unique Students</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-3">
            <Filter size={20} className="text-gray-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-700">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by student or quiz..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Score Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Score Range: {scoreRange.min}% - {scoreRange.max}%
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scoreRange.min}
                  onChange={(e) => setScoreRange({...scoreRange, min: parseInt(e.target.value)})}
                  className="w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scoreRange.max}
                  onChange={(e) => setScoreRange({...scoreRange, max: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                />
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="passed">Passed (≥60%)</option>
                <option value="failed">Failed (&lt;60%)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Score Distribution */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Score Distribution</h3>
          <div className="flex items-end h-32 space-x-1">
            {getScoreDistribution().map((range, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full ${range.color} rounded-t-lg transition-all duration-300`}
                  style={{ height: `${Math.max(range.percentage * 0.8, 5)}%` }}
                  title={`${range.label}: ${range.count} submissions (${range.percentage.toFixed(1)}%)`}
                ></div>
                <div className="text-xs text-gray-600 mt-1">{range.label}</div>
                <div className="text-xs font-bold">{range.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Submissions Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quiz & Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filterSubmissions().map((sub, index) => (
                <tr key={sub._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm font-medium text-gray-900">{index + 1}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 flex items-center">
                        <BookOpen size={16} className="mr-2 text-blue-500" />
                        {sub.quizId?.title || "Unknown Quiz"}
                      </div>
                      <div className="text-sm text-gray-600 mt-1 flex items-center">
                        <User size={14} className="mr-1" />
                        {sub.studentId?.name || "Unknown Student"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center cursor-pointer"
                           onClick={() => copySubmissionId(sub._id)} title="Click to copy">
                        <Copy size={12} className="mr-1" />
                        ID: {sub._id?.substring(0, 8)}...
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div className="font-bold text-lg">
                        {sub.score || 0}/{sub.totalPossiblePoints || 0}
                      </div>
                      <div className="text-gray-600">
                        <span className="font-medium">{sub.percentage || 0}%</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        ✓ {sub.correctCount || 0} | ✗ {sub.incorrectCount || 0} | ? {sub.unansweredCount || 0}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(sub.percentage || 0)}`}>
                        {getStatusText(sub.percentage || 0)}
                      </div>
                      <div className="ml-3 w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${(sub.percentage || 0) >= 60 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(sub.percentage || 0, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(sub.submittedAt)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(sub.submittedAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleViewDetails(sub)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm"
                    >
                      <Eye size={16} className="mr-2" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filterSubmissions().length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FileText size={64} className="mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No submissions found
            </h3>
            <p className="text-gray-500">
              {submissions.length === 0 
                ? "No students have submitted any quizzes yet." 
                : "No submissions match your current filters."}
            </p>
          </div>
        )}

        {/* Summary */}
        {filterSubmissions().length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
            <div>
              Showing <span className="font-medium">{filterSubmissions().length}</span> of{" "}
              <span className="font-medium">{submissions.length}</span> submissions
            </div>
            <div className="mt-2 sm:mt-0">
              <button
                onClick={exportToCSV}
                disabled={filterSubmissions().length === 0}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 flex items-center"
              >
                <Download size={14} className="mr-1" />
                Export Results
              </button>
            </div>
          </div>
        )}
      </div>

    {/* View Submission Details Modal */}
{isViewModalOpen && viewingSubmission && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
      {/* Modal Header */}
      <div className="flex-shrink-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center">
          <div className="bg-blue-100 p-3 rounded-lg mr-4">
            <FileText className="text-blue-600" size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Submission Details</h3>
            <p className="text-sm text-gray-600 mt-1">Complete analysis of quiz submission</p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsViewModalOpen(false);
            setViewingSubmission(null);
            setExpandedQuestions({});
          }}
          className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Modal Body - Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Score Summary */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
            <div className="flex items-center mb-3">
              <Award className="text-blue-600 mr-3" size={24} />
              <div>
                <div className="text-sm font-medium text-blue-700">Total Score</div>
                <div className="text-2xl font-bold text-blue-800">
                  {viewingSubmission.score || 0}/{viewingSubmission.totalPossiblePoints || 0}
                </div>
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-900 mb-2">{viewingSubmission.percentage || 0}%</div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${getStatusColor(viewingSubmission.percentage || 0)}`}>
              {getStatusText(viewingSubmission.percentage || 0)}
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
            <div className="flex items-center mb-3">
              <User className="text-green-600 mr-3" size={24} />
              <div>
                <div className="text-sm font-medium text-green-700">Student Information</div>
                <div className="text-lg font-bold text-green-800">
                  {viewingSubmission.studentId?.name || "Unknown Student"}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Student ID: <span className="font-mono text-gray-800">{viewingSubmission.studentId?._id?.substring(0, 8)}...</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
            <div className="flex items-center mb-3">
              <BookOpen className="text-purple-600 mr-3" size={24} />
              <div>
                <div className="text-sm font-medium text-purple-700">Quiz Information</div>
                <div className="text-lg font-bold text-purple-800">
                  {viewingSubmission.quizId?.title || "Unknown Quiz"}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Submitted: {formatDateTime(viewingSubmission.submittedAt)}
            </div>
          </div>
        </div>

        {/* Answer Breakdown */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <CheckCircle className="text-green-600 mr-3" size={24} />
              <div>
                <div className="text-2xl font-bold text-green-700">{viewingSubmission.correctCount || 0}</div>
                <div className="text-sm text-green-600">Correct Answers</div>
              </div>
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center">
              <XCircle className="text-red-600 mr-3" size={24} />
              <div>
                <div className="text-2xl font-bold text-red-700">{viewingSubmission.incorrectCount || 0}</div>
                <div className="text-sm text-red-600">Incorrect Answers</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Clock className="text-gray-600 mr-3" size={24} />
              <div>
                <div className="text-2xl font-bold text-gray-700">{viewingSubmission.unansweredCount || 0}</div>
                <div className="text-sm text-gray-600">Unanswered</div>
              </div>
            </div>
          </div>
        </div>

        {/* Question-wise Analysis - CLEARLY SHOW ANSWERS */}
        <div className="mb-8">
          <h4 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b flex items-center">
            <Hash className="mr-3 text-blue-600" size={24} />
            Detailed Question Analysis ({viewingSubmission.totalQuestions || 0} Questions)
          </h4>
          
          {viewingSubmission.detailedResults && viewingSubmission.detailedResults.length > 0 ? (
            <div className="space-y-6">
              {viewingSubmission.detailedResults.map((result, index) => (
                <div key={result._id || index} className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                  {/* Question Header */}
                  <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 font-bold ${
                        result.isCorrect ? 'bg-green-100 text-green-800 border-2 border-green-300' : 'bg-red-100 text-red-800 border-2 border-red-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h5 className="font-bold text-gray-800 text-lg">{result.question || `Question ${index + 1}`}</h5>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            result.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                          </span>
                          <span className="text-sm text-gray-600">
                            Points: <span className="font-bold">{result.points || 0}</span>
                          </span>
                          <span className="text-sm text-gray-600">
                            Earned: <span className="font-bold">{result.earnedPoints || 0}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Answer Comparison - CLEAR DISPLAY */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Student's Answer */}
                      <div className={`p-5 rounded-xl border-2 ${
                        result.isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                      }`}>
                        <div className="flex items-center mb-3">
                          <User className={`mr-3 ${result.isCorrect ? 'text-green-600' : 'text-red-600'}`} size={20} />
                          <div className="text-lg font-bold text-gray-800">Student's Answer</div>
                        </div>
                        <div className="p-4 bg-white rounded-lg border">
                          <div className="text-gray-800 text-lg font-medium">{result.userAnswer || "No answer provided"}</div>
                          <div className={`text-sm font-medium mt-2 ${
                            result.isCorrect ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {result.isCorrect ? '✓ Correct Answer' : '✗ Incorrect Answer'}
                          </div>
                        </div>
                      </div>

                      {/* Correct Answer */}
                      <div className="p-5 rounded-xl border-2 border-green-300 bg-green-50">
                        <div className="flex items-center mb-3">
                          <CheckCircle className="mr-3 text-green-600" size={20} />
                          <div className="text-lg font-bold text-gray-800">Correct Answer</div>
                        </div>
                        <div className="p-4 bg-white rounded-lg border border-green-200">
                          <div className="text-gray-800 text-lg font-medium">{result.correctAnswer || "N/A"}</div>
                          <div className="text-sm text-green-600 font-medium mt-2">
                            ✓ Expected Answer
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Question ID</div>
                          <div className="font-mono text-sm text-gray-700 truncate">{result.questionId || "N/A"}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Status</div>
                          <div className={`capitalize font-medium ${
                            result.status === 'correct' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {result.status || "N/A"}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Result ID</div>
                          <div className="font-mono text-sm text-gray-700 truncate">{result._id?.substring(0, 12) || "N/A"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <FileText size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No detailed results available for this submission.</p>
            </div>
          )}
        </div>

        {/* Submission Metadata */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
          <h5 className="font-bold text-gray-800 mb-4 flex items-center">
            <Calendar className="mr-3 text-gray-600" size={20} />
            Submission Information
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Submission ID</div>
              <div className="font-mono text-sm text-gray-800 truncate" title={viewingSubmission._id}>
                {viewingSubmission._id}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Submitted At</div>
              <div className="font-medium text-gray-800">{formatDateTime(viewingSubmission.submittedAt)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Course ID</div>
              <div className="font-mono text-sm text-gray-800 truncate">{viewingSubmission.courseId || "N/A"}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Created At</div>
              <div className="font-medium text-gray-800">{formatDateTime(viewingSubmission.createdAt)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Footer - ALWAYS VISIBLE */}
      <div className="flex-shrink-0 flex justify-between items-center p-6 border-t bg-gray-50">
        <button
          onClick={() => copySubmissionId(viewingSubmission._id)}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 flex items-center transition-colors"
        >
          <Copy size={18} className="mr-2" />
          Copy Submission ID
        </button>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              // Implement download functionality here
              const dataStr = JSON.stringify(viewingSubmission, null, 2);
              const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
              const exportFileDefaultName = `submission_${viewingSubmission._id}.json`;
              const linkElement = document.createElement('a');
              linkElement.setAttribute('href', dataUri);
              linkElement.setAttribute('download', exportFileDefaultName);
              linkElement.click();
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center transition-colors"
          >
            <Download size={18} className="mr-2" />
            Download JSON
          </button>
          <button
            onClick={() => setIsViewModalOpen(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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

export default QuizSubmission;