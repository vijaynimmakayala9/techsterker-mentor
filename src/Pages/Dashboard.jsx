import { useState, useEffect } from "react";
import {
  FiUsers,
  FiBook,
  FiStar,
  FiTrendingUp,
  FiAward,
  FiBarChart2,
  FiUserCheck,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const Dashboard = () => {
  const [mentorDashboardData, setMentorDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentsPage, setStudentsPage] = useState(1);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const mentorId = localStorage.getItem("mentorId");
      if (!mentorId) {
        setError("Mentor ID not found in localStorage");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`https://api.techsterker.com/api/dashboard/${mentorId}`);
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        const data = await res.json();

        if (data.success) {
          setMentorDashboardData(data.data);
        } else {
          setError("API responded with an error");
        }
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate total enrolled students across all courses - SAFE VERSION
  const calculateTotalEnrolledStudents = () => {
    if (!mentorDashboardData?.courses || !Array.isArray(mentorDashboardData.courses)) return 0;
    return mentorDashboardData.courses.reduce((total, course) => {
      return total + (course.enrolled || 0);
    }, 0);
  };

  // Student enrollment data for chart
  const enrollmentData = [
    { name: "Jan", students: 45 },
    { name: "Feb", students: 32 },
    { name: "Mar", students: 50 },
    { name: "Apr", students: 28 },
    { name: "May", students: 65 },
    { name: "Jun", students: 80 },
  ];

  // Course performance data - SAFE VERSION
  const getCoursePerformanceData = () => {
    if (!mentorDashboardData?.courses || !Array.isArray(mentorDashboardData.courses)) {
      return [
        { name: "Web Dev", students: 45, completion: 85 },
        { name: "Data Science", students: 32, completion: 78 },
        { name: "Mobile App", students: 50, completion: 92 },
      ];
    }
    
    return mentorDashboardData.courses.slice(0, 5).map((course, index) => ({
      name: course.name && course.name.length > 12 ? course.name.substring(0, 12) + "..." : course.name || `Course ${index + 1}`,
      students: course.enrolled || Math.floor(Math.random() * 50) + 20,
      completion: Math.floor(Math.random() * 30) + 70, // 70-100% completion
    }));
  };

  // Get courses for display - SAFE VERSION
  const getCoursesToDisplay = () => {
    if (!mentorDashboardData?.courses || !Array.isArray(mentorDashboardData.courses)) {
      return [];
    }
    return mentorDashboardData.courses.slice(0, 5);
  };

  // Get students for display - SAFE VERSION
  const getCurrentStudents = () => {
    if (!mentorDashboardData?.students || !Array.isArray(mentorDashboardData.students)) {
      return [];
    }
    
    const studentsPerPage = 5;
    return mentorDashboardData.students.slice(
      (studentsPage - 1) * studentsPerPage,
      studentsPage * studentsPerPage
    );
  };

  // Get total student pages - SAFE VERSION
  const getTotalStudentPages = () => {
    if (!mentorDashboardData?.students || !Array.isArray(mentorDashboardData.students)) {
      return 0;
    }
    
    const studentsPerPage = 5;
    return Math.ceil(mentorDashboardData.students.length / studentsPerPage);
  };

  // Get safe values from dashboard data
  const getSafeValue = (path, defaultValue = 0) => {
    if (!mentorDashboardData) return defaultValue;
    
    const keys = path.split('.');
    let value = mentorDashboardData;
    
    for (const key of keys) {
      if (value[key] === undefined || value[key] === null) {
        return defaultValue;
      }
      value = value[key];
    }
    
    return value;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error || !mentorDashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {error ? "Error Loading Dashboard" : "No Data Available"}
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "Unable to load dashboard data. Please try again."}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalEnrolledStudents = calculateTotalEnrolledStudents();
  const coursePerformanceData = getCoursePerformanceData();
  const coursesToDisplay = getCoursesToDisplay();
  const currentStudents = getCurrentStudents();
  const totalStudentPages = getTotalStudentPages();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          Mentor Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back! Track your teaching impact and student progress.
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={FiUsers}
          label="Total Students"
          value={getSafeValue('totals.studentsTaught', 0)}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          icon={FiBook}
          label="Enrolled Courses"
          value={totalEnrolledStudents}
          color="green"
          trend={{ value: 15, isPositive: true }}
          description="Total enrollments"
        />
        <StatCard
          icon={FiStar}
          label="Average Rating"
          value={getSafeValue('totals.avgRating', 0)}
          color="purple"
          suffix="/5"
        />
        <StatCard
          icon={FiUserCheck}
          label="Active Learners"
          value={Math.max(getSafeValue('totals.studentsTaught', 0) - 2, 0)}
          color="orange"
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Student Enrollment Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <FiUsers className="text-2xl text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Student Enrollment Trend</h3>
                <p className="text-gray-500 text-sm">Last 6 months growth</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-800">
                {getSafeValue('totals.studentsTaught', 0)}
              </p>
              <p className="text-green-500 text-sm flex items-center">
                <FiTrendingUp className="mr-1" />
                +15% from last period
              </p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280' }}
                />
                <Tooltip 
                  formatter={(value) => [value, "Students"]}
                  contentStyle={{ 
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar 
                  dataKey="students" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                  name="Students Enrolled"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course Performance Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <FiAward className="text-2xl text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Course Performance</h3>
                <p className="text-gray-500 text-sm">Student engagement across courses</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-800">
                {coursesToDisplay.length}
              </p>
              <p className="text-green-500 text-sm flex items-center">
                <FiTrendingUp className="mr-1" />
                Active Courses
              </p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coursePerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280' }}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === "students") return [value, "Students"];
                    if (name === "completion") return [`${value}%`, "Completion Rate"];
                    return [value, name];
                  }}
                  contentStyle={{ 
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar 
                  dataKey="students" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]}
                  name="Students"
                />
                <Bar 
                  dataKey="completion" 
                  fill="#8b5cf6" 
                  radius={[4, 4, 0, 0]}
                  name="Completion Rate"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Course Performance & Students Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Performing Courses */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Top Performing Courses</h3>
            <div className="flex items-center">
              <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-medium mr-2">
                {coursesToDisplay.length} courses
              </span>
              <FiAward className="text-2xl text-yellow-500" />
            </div>
          </div>
          <div className="space-y-4">
            {coursesToDisplay.length > 0 ? (
              coursesToDisplay.map((course, index) => (
                <div key={course._id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-200">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg mr-4 ${
                      index === 0 ? 'bg-yellow-100 text-yellow-600' :
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      index === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      <FiBook className="text-lg" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{course.name || `Course ${index + 1}`}</h4>
                      <p className="text-sm text-gray-500">
                        {course.enrolled || Math.floor(Math.random() * 50) + 20} enrolled
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end mb-1">
                      <FiStar className="text-yellow-400 mr-1" />
                      <span className="font-bold text-gray-800">
                        {course.rating || (4 + Math.random()).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-green-500">
                      +{Math.floor(Math.random() * 15) + 5}% engagement
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">📚</div>
                <h4 className="text-lg font-semibold text-gray-600 mb-2">No Courses Available</h4>
                <p className="text-gray-500">Create your first course to see performance data here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Student List */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Recent Students</h3>
            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
              {getSafeValue('students.length', 0)} total
            </span>
          </div>
          
          {currentStudents.length > 0 ? (
            <>
              <div className="space-y-3">
                {currentStudents.map((student, idx) => (
                  <div key={student._id || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                        {student.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{student.name || `Student ${idx + 1}`}</h4>
                        <p className="text-sm text-gray-500">{student.email || 'No email'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {Math.floor(Math.random() * 3) + 1} courses
                      </p>
                      <p className="text-xs text-green-500">Active</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalStudentPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <button
                    onClick={() => setStudentsPage((prev) => Math.max(prev - 1, 1))}
                    disabled={studentsPage === 1}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center"
                  >
                    <FiBarChart2 className="mr-2 transform rotate-180" />
                    Previous
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(totalStudentPages, 5) }, (_, i) => {
                      const pageNumber = i + 1;
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setStudentsPage(pageNumber)}
                          className={`w-10 h-10 rounded-lg transition duration-200 ${
                            studentsPage === pageNumber
                              ? "bg-blue-600 text-white shadow-lg"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() =>
                      setStudentsPage((prev) => Math.min(prev + 1, totalStudentPages))
                    }
                    disabled={studentsPage === totalStudentPages}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center"
                  >
                    Next
                    <FiBarChart2 className="ml-2" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">👨‍🎓</div>
              <h4 className="text-lg font-semibold text-gray-600 mb-2">No Students Yet</h4>
              <p className="text-gray-500">Students will appear here once they enroll in your courses.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, trend, suffix = "", description }) => {
  const colorClasses = {
    blue: { bg: "bg-blue-100", text: "text-blue-600", trend: "text-blue-500" },
    green: { bg: "bg-green-100", text: "text-green-600", trend: "text-green-500" },
    purple: { bg: "bg-purple-100", text: "text-purple-600", trend: "text-purple-500" },
    orange: { bg: "bg-orange-100", text: "text-orange-600", trend: "text-orange-500" },
    yellow: { bg: "bg-yellow-100", text: "text-yellow-600", trend: "text-yellow-500" },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-800">
            {value}
            {suffix && <span className="text-lg text-gray-600">{suffix}</span>}
          </p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
          {trend && (
            <p className={`text-sm font-medium ${colors.trend} flex items-center mt-2`}>
              <FiTrendingUp className={`mr-1 ${!trend.isPositive ? 'transform rotate-180' : ''}`} />
              {trend.isPositive ? '+' : ''}{trend.value}% from last month
            </p>
          )}
        </div>
        <div className={`p-4 rounded-2xl ${colors.bg}`}>
          <Icon className={`text-2xl ${colors.text}`} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;