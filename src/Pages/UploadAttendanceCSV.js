import React, { useState, useRef } from 'react';
import axios from 'axios';
import { FiUploadCloud } from 'react-icons/fi'; // Feather icons upload cloud

const API_BASE = 'https://api.techsterker.com/api';

const UploadAttendanceCSV = () => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const mentorId = localStorage.getItem('mentorId');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setSuccessMessage('');
  };

  // Trigger file input click on icon click
  const handleIconClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!mentorId) {
      setError('Mentor not logged in.');
      return;
    }

    if (!file) {
      setError('Please select a CSV file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await axios.post(
        `${API_BASE}/uploadattendance/${mentorId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        setSuccessMessage(response.data.message || 'Attendance uploaded successfully!');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = null;
      } else {
        setError(response.data.message || 'Failed to upload attendance.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Server error while uploading attendance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-blue-900">Upload Attendance CSV</h2>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {successMessage && <p className="text-green-600 mb-4">{successMessage}</p>}

      <form onSubmit={handleUpload}>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="hidden"
          id="csvFileInput"
        />

        {/* Cloud Upload Icon as file chooser */}
        <div
          onClick={handleIconClick}
          className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-blue-500 rounded p-8 mb-4 hover:bg-blue-50 transition"
          title="Click to select CSV file"
        >
          <FiUploadCloud size={48} className="text-blue-600 mb-2" />
          <p className="text-blue-600 font-medium">
            {file ? `Selected file: ${file.name}` : 'Click here to upload CSV file'}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Uploading...' : 'Upload Attendance'}
        </button>
      </form>
    </div>
  );
};

export default UploadAttendanceCSV;
