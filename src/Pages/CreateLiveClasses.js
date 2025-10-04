import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'https://api.techsterker.com/api';

const CreateLiveClassByMentor = () => {
  const [batches, setBatches] = useState([]);
  const [mentorName, setMentorName] = useState('');

  const [className, setClassName] = useState('');
  const [selectedEnrollment, setSelectedEnrollment] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [date, setDate] = useState('');
  const [timing, setTiming] = useState('');
  const [link, setLink] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

    const navigate = useNavigate();

  const mentorId = localStorage.getItem('mentorId');

  // 🔁 Fetch mentor data including enrolled batches
  useEffect(() => {
    if (!mentorId) {
      setError('Mentor not logged in.');
      return;
    }

    const fetchMentorData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${API_BASE}/mentorenrollments/${mentorId}`);
        if (res.data?.success) {
          setBatches(res.data.enrolledBatches || []);
          setMentorName(res.data.mentor?.fullName || '');
        } else {
          setError('No enrolled batches found for this mentor.');
        }
      } catch (err) {
        console.error('Error fetching mentor data:', err);
        setError('Failed to fetch mentor data.');
      } finally {
        setLoading(false);
      }
    };

    fetchMentorData();
  }, [mentorId]);

  const handleCreateLiveClass = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (!className || !subjectName || !date || !timing || !link || !selectedEnrollment) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    const liveClassData = {
      className,
      enrollmentId: selectedEnrollment,
      mentorId,
      subjectName,
      date,
      timing,
      link,
    };

    try {
      const response = await axios.post(`${API_BASE}/createliveclass`, liveClassData);
      if (response.data.success) {
        setSuccessMessage('Live class created successfully');

        setTimeout(() => {
          navigate('/mentorliveclasses');
        }, 1000);

        setClassName('');
        setSubjectName('');
        setDate('');
        setTiming('');
        setLink('');
        setSelectedEnrollment('');
      } else {
        setError(response.data.message || 'Something went wrong');
      }
    } catch (err) {
      console.error('Failed to create live class:', err);
      setError('Failed to create live class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-lg bg-white max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold text-blue-900 mb-4">Create Live Class</h2>

      {mentorName && (
        <p className="mb-4 text-gray-700 font-medium">Mentor: {mentorName}</p>
      )}
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {successMessage && <p className="text-green-600 mb-4">{successMessage}</p>}

      <form onSubmit={handleCreateLiveClass}>
        {/* Batch Dropdown */}
        <div className="mb-4">
          <label className="block text-gray-700">Select Batch</label>
          <select
            value={selectedEnrollment}
            onChange={(e) => setSelectedEnrollment(e.target.value)}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select a batch</option>
            {batches.map((batch) => (
              <option key={batch._id} value={batch._id}>
                {batch.batchName}
              </option>
            ))}
          </select>
        </div>

        {/* Class Name */}
        <div className="mb-4">
          <label htmlFor="className" className="block text-gray-700">Class Name</label>
          <input
            id="className"
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter class name"
            required
          />
        </div>

        {/* Subject Name */}
        <div className="mb-4">
          <label htmlFor="subjectName" className="block text-gray-700">Subject Name</label>
          <input
            id="subjectName"
            type="text"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter subject name"
            required
          />
        </div>

        {/* Date */}
        <div className="mb-4">
          <label htmlFor="date" className="block text-gray-700">Date</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Timing */}
        {/* Timing (Manual Input) */}
        <div className="mb-4">
          <label htmlFor="timing" className="block text-gray-700">Timing</label>
          <input
            id="timing"
            type="text"
            value={timing}
            onChange={(e) => setTiming(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="e.g., 10:30 AM - 11:30 AM"
            required
          />
        </div>


        {/* Class Link */}
        <div className="mb-6">
          <label htmlFor="link" className="block text-gray-700">Class Link</label>
          <input
            id="link"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter class link"
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Creating Live Class...' : 'Create Live Class'}
        </button>
      </form>
    </div>
  );
};

export default CreateLiveClassByMentor;
