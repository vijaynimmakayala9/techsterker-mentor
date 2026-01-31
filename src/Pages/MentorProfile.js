import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "https://api.techsterker.com/api";

const MentorProfile = () => {
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const mentorId = localStorage.getItem("mentorId");

  useEffect(() => {
    if (!mentorId) {
      setError("Mentor not logged in");
      return;
    }
    fetchProfile();
  }, [mentorId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/our-mentor/profile/${mentorId}`);
      setMentor(res.data?.data || null);
    } catch {
      setError("Failed to load mentor profile.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- STATES ---------------- */

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-indigo-500 text-sm">
          Loading profile…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchProfile}
          className="mt-4 px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!mentor) return null;

  /* ---------------- UI ---------------- */

  return (
    <div className="flex justify-center px-4 py-10">
      <div className="relative w-full max-w-sm sm:max-w-md rounded-3xl overflow-hidden shadow-[0_25px_70px_-20px_rgba(79,70,229,0.6)]">
        
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500" />

        {/* Glass Card */}
        <div className="relative bg-white/15 backdrop-blur-xl border border-white/20">
          
          {/* Header */}
          <div className="text-center px-6 pt-10 pb-6">
            <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-white to-slate-100 flex items-center justify-center text-2xl font-bold text-indigo-700 shadow-xl ring-4 ring-white/40">
              {mentor.firstName?.[0]}
              {mentor.lastName?.[0]}
            </div>

            <h2 className="mt-4 text-2xl font-semibold text-white tracking-wide">
              {mentor.firstName} {mentor.lastName}
            </h2>

            <p className="mt-1 text-sm text-indigo-100">
              Professional Mentor
            </p>

            <div className="mt-3 inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/20 text-xs text-white/90 backdrop-blur">
              ID · {mentor._id?.slice(-6)}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/20" />

          {/* Info */}
          <div className="px-6 py-6 space-y-4 text-sm">
            <InfoRow label="Email" value={mentor.email} />
            <InfoRow label="Phone" value={mentor.phoneNumber} />
            <InfoRow label="Expertise" value={mentor.expertise} />
            <InfoRow
              label="Member Since"
              value={new Date(mentor.createdAt).toLocaleDateString()}
            />
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-black/10 text-xs text-white/80 flex justify-between">
            <span>TechSterker</span>
            <span>
              Updated ·{" "}
              {new Date(mentor.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- ROW COMPONENT ---------------- */

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between gap-4">
    <span className="text-white/70">{label}</span>
    <span className="text-white font-medium text-right truncate max-w-[60%]">
      {value || "N/A"}
    </span>
  </div>
);

export default MentorProfile;
