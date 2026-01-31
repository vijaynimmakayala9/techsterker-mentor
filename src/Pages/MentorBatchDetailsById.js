import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaUsers,
  FaBook,
  FaClock,
  FaCalendarAlt,
  FaUserGraduate,
  FaCertificate,
  FaCheckCircle,
} from "react-icons/fa";
import { useParams } from "react-router-dom";

const API_BASE = "https://api.techsterker.com/api";

const MentorBatchDetails = () => {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/our-mentor/enrollment/${id}/complete-details`
        );

        if (res.data.success) {
          setData(res.data.data);
        } else {
          setError("Failed to load enrollment details");
        }
      } catch {
        setError("Something went wrong while fetching data");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-14 w-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
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
    enrollment,
    statistics,
    students,
    schedule,
    certificates,
    mentorDetails,
  } = data;

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg p-6">
          <h1 className="text-2xl font-bold">{enrollment.batchName}</h1>
          <p className="opacity-90">{enrollment.course?.name}</p>

          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="bg-white/20 px-3 py-1 rounded-full">
              {enrollment.timings}
            </span>
            <span className="bg-white/20 px-3 py-1 rounded-full">
              {enrollment.category}
            </span>
            <span className="bg-white/20 px-3 py-1 rounded-full">
              {enrollment.duration}
            </span>
            <span className="bg-white/20 px-3 py-1 rounded-full">
              Start: {formatDate(enrollment.startDate)}
            </span>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <Stat icon={FaUsers} label="Students" value={statistics.totalStudents} />
          <Stat icon={FaCalendarAlt} label="Live Classes" value={statistics.totalLiveClasses} />
          <Stat icon={FaBook} label="Modules" value={statistics.totalCourseModules} />
          <Stat icon={FaCertificate} label="Certificates" value={statistics.totalCertificates} />
          <Stat icon={FaClock} label="Upcoming" value={statistics.upcomingClasses} />
          <Stat
            icon={FaCheckCircle}
            label="Completion"
            value={`${statistics.completionRate}%`}
          />
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* STUDENTS */}
            <div className="bg-white rounded-2xl shadow-md p-5">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaUserGraduate /> Enrolled Students
              </h2>

              {students.list.length ? (
                students.list.map((s) => (
                  <div
                    key={s._id}
                    className="flex justify-between items-center bg-slate-50 p-4 rounded-lg mb-3"
                  >
                    <div>
                      <p className="font-semibold">{s.fullName}</p>
                      <p className="text-sm text-gray-500">{s.email}</p>
                      <p className="text-xs text-gray-400">
                        {s.degree} • {s.department} • {s.yearOfPassedOut}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p>{s.courseCount} Courses</p>
                      <p className="text-green-600">
                        {s.certificateCount} Certificates
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No students enrolled.</p>
              )}
            </div>

            {/* CERTIFICATES */}
            <div className="bg-white rounded-2xl shadow-md p-5">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaCertificate /> Certificates Issued
              </h2>

              {certificates.details.length ? (
                certificates.details.map((c) => (
                  <div
                    key={c._id}
                    className="flex justify-between items-center border p-4 rounded-lg mb-3"
                  >
                    <div>
                      <p className="font-medium">{c.studentName}</p>
                      <p className="text-sm text-gray-500">{c.studentEmail}</p>
                      <p className="text-xs text-gray-400">
                        {c.studentMobile}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-green-600">
                        {c.status}
                      </span>
                      <p className="text-xs text-gray-500">
                        {formatDate(c.issuedAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No certificates issued.</p>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* MENTOR */}
            <div className="bg-white rounded-2xl shadow-md p-5">
              <h2 className="text-lg font-semibold mb-4">Mentor Details</h2>
              <p className="font-semibold">{mentorDetails.fullName}</p>
              <p className="text-sm text-gray-500">{mentorDetails.email}</p>
              <p className="text-sm text-gray-500">{mentorDetails.phoneNumber}</p>

              <div className="flex flex-wrap gap-1 mt-3">
                {mentorDetails.subjects
                  .filter((s) => s.trim())
                  .map((s, i) => (
                    <span
                      key={i}
                      className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded"
                    >
                      {s}
                    </span>
                  ))}
              </div>
            </div>

            {/* SCHEDULE */}
            <div className="bg-white rounded-2xl shadow-md p-5">
              <h2 className="text-lg font-semibold mb-4">Schedule</h2>
              <p className="text-sm text-gray-600">
                Upcoming Classes:{" "}
                <span className="font-semibold">
                  {schedule.upcomingClasses.count}
                </span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Completed Classes:{" "}
                <span className="font-semibold">
                  {schedule.completedClasses.count}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* STAT CARD */
const Stat = ({ icon: Icon, label, value }) => (
  <div className="bg-white rounded-xl shadow-md p-4 text-center">
    <Icon className="text-indigo-600 mx-auto mb-1" />
    <div className="text-xl font-bold">{value}</div>
    <div className="text-xs text-gray-500">{label}</div>
  </div>
);

export default MentorBatchDetails;
