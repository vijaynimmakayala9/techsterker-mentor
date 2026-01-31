import { useEffect, useState } from "react";
import {
  FiUsers,
  FiBook,
  FiAward,
  FiCalendar,
  FiActivity,
  FiClipboard,
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

const API_BASE = "https://api.techsterker.com/api/dashboard";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const mentorId = localStorage.getItem("mentorId");
    if (!mentorId) {
      setError("Mentor ID not found");
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/${mentorId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
        else setError("Failed to load dashboard");
      })
      .catch(() => setError("Server error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-14 w-14 border-b-2 border-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center">
          <h2 className="text-xl font-bold text-red-600">Error</h2>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const {
    mentor,
    quickStats,
    performance,
    charts,
    recentStudents,
    recentActivities,
  } = data;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome, {mentor.fullName}
        </h1>
        <p className="text-gray-500">
          {mentor.expertise} • Experience: {mentor.totalExperience}
        </p>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {quickStats.map((s, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition p-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">{s.title}</p>
                <p className="text-3xl font-bold text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.description}</p>
              </div>
              <div
                className="text-3xl p-4 rounded-xl"
                style={{ background: s.color + "20" }}
              >
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PERFORMANCE SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <PerformanceCard label="Attendance" value={`${performance.attendanceRate}%`} />
        <PerformanceCard label="Quiz Avg" value={`${performance.averageQuizScore}%`} />
        <PerformanceCard label="Engagement" value={`${performance.studentEngagement}%`} />
        <PerformanceCard label="Completion" value={`${performance.completionRate}%`} />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
        <ChartCard title="Monthly Classes" icon={FiCalendar}>
          <BarChart data={charts.monthlyClasses}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="classes" fill="#6366f1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Quiz Performance" icon={FiClipboard}>
          <BarChart data={charts.quizPerformance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="quiz" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="submissions" fill="#22c55e" />
            <Bar dataKey="averageScore" fill="#a855f7" />
          </BarChart>
        </ChartCard>
      </div>

      {/* BOTTOM SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* RECENT STUDENTS */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiUsers /> Recent Students
          </h3>
          {recentStudents.length ? (
            recentStudents.map((s, i) => (
              <div
                key={i}
                className="flex justify-between items-center bg-slate-50 rounded-lg p-4 mb-3"
              >
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-gray-500">{s.email}</p>
                </div>
                <div className="text-right text-sm">
                  <p>{s.course}</p>
                  <p className="text-gray-500">{s.batch}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No recent students</p>
          )}
        </div>

        {/* RECENT ACTIVITIES */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiActivity /> Recent Activities
          </h3>
          {recentActivities.length ? (
            recentActivities.map((a, i) => (
              <div
                key={i}
                className="border-b last:border-none py-3"
              >
                <p className="font-medium">{a.title}</p>
                <p className="text-sm text-gray-500">{a.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(a.date).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

/* SMALL COMPONENTS */

const ChartCard = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-2xl shadow-md p-6">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <Icon /> {title}
    </h3>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  </div>
);

const PerformanceCard = ({ label, value }) => (
  <div className="bg-white rounded-xl shadow-md p-4 text-center">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-2xl font-bold text-indigo-600">{value}</p>
  </div>
);

export default Dashboard;
