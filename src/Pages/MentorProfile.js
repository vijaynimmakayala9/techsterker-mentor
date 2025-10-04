import React, { useState, useEffect } from "react";
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
    fetchMentorProfile();
  }, [mentorId]);

  const fetchMentorProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/our-mentor/profile/${mentorId}`);
      if (res.data?.data) {
        setMentor(res.data.data);
      } else {
        setError("Mentor profile not found.");
      }
    } catch (err) {
      console.error("Error fetching mentor profile:", err);
      setError("Failed to fetch mentor profile.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-lg">Loading mentor profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-lg">{error}</p>
        <button
          onClick={fetchMentorProfile}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return mentor ? (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-blue-900 mb-4">
        {mentor.firstName} {mentor.lastName}
      </h2>

      <div className="space-y-2">
        <p><strong>Email:</strong> {mentor.email || "N/A"}</p>
        <p><strong>Phone:</strong> {mentor.phoneNumber || "N/A"}</p>
        <p><strong>Expertise:</strong> {mentor.expertise || "N/A"}</p>
        <p><strong>Created At:</strong> {new Date(mentor.createdAt).toLocaleDateString()}</p>
        <p><strong>Last Updated:</strong> {new Date(mentor.updatedAt).toLocaleDateString()}</p>
      </div>
    </div>
  ) : null;
};

export default MentorProfile;
