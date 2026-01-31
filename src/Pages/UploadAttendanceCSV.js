import React, { useState, useRef } from 'react';
import axios from 'axios';
import { FiUploadCloud, FiDownload } from 'react-icons/fi';

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

  const downloadSampleCSV = () => {
    const sampleData = [
      {
        'Class Name': 'Web Development Batch 1',
        'Subject': 'JavaScript Basics',
        'Date': '2024-01-15',
        'Timing': '10:00 AM - 12:00 PM',
        'Student Name': 'John Doe',
        'Enrollment ID': 'ENR001',
        'User ID': 'USER001',
        'Status': 'present'
      },
      {
        'Class Name': 'Web Development Batch 1',
        'Subject': 'JavaScript Basics',
        'Date': '2024-01-15',
        'Timing': '10:00 AM - 12:00 PM',
        'Student Name': 'Jane Smith',
        'Enrollment ID': 'ENR002',
        'User ID': 'USER002',
        'Status': 'absent'
      },
      {
        'Class Name': 'Data Science Batch 2',
        'Subject': 'Python for Data Science',
        'Date': '2024-01-16',
        'Timing': '02:00 PM - 04:00 PM',
        'Student Name': 'Robert Johnson',
        'Enrollment ID': 'ENR003',
        'User ID': 'USER003',
        'Status': 'present'
      },
      {
        'Class Name': 'Data Science Batch 2',
        'Subject': 'Python for Data Science',
        'Date': '2024-01-16',
        'Timing': '02:00 PM - 04:00 PM',
        'Student Name': 'Sarah Williams',
        'Enrollment ID': 'ENR004',
        'User ID': 'USER004',
        'Status': 'present'
      },
      {
        'Class Name': 'Mobile App Development',
        'Subject': 'React Native',
        'Date': '2024-01-17',
        'Timing': '11:00 AM - 01:00 PM',
        'Student Name': 'Michael Brown',
        'Enrollment ID': 'ENR005',
        'User ID': 'USER005',
        'Status': 'absent'
      }
    ];

    // Convert to CSV
    const headers = ['Class Name', 'Subject', 'Date', 'Timing', 'Student Name', 'Enrollment ID', 'User ID', 'Status'];
    const csvRows = [
      headers.join(','),
      ...sampleData.map(row => headers.map(header => {
        const cell = row[header] || '';
        return `"${cell}"`;
      }).join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'attendance_sample_format.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-600">
            Upload Attendance CSV
          </h2>

          {/* Info Card */}
          <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-2">📋 Required CSV Format:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="bg-white p-2 rounded border">
                <span className="font-medium text-blue-600">Class Name</span>
              </div>
              <div className="bg-white p-2 rounded border">
                <span className="font-medium text-blue-600">Subject</span>
              </div>
              <div className="bg-white p-2 rounded border">
                <span className="font-medium text-blue-600">Date</span>
                <p className="text-xs text-gray-500">YYYY-MM-DD</p>
              </div>
              <div className="bg-white p-2 rounded border">
                <span className="font-medium text-blue-600">Timing</span>
                <p className="text-xs text-gray-500">10:00 AM - 12:00 PM</p>
              </div>
              <div className="bg-white p-2 rounded border">
                <span className="font-medium text-blue-600">Student Name</span>
              </div>
              <div className="bg-white p-2 rounded border">
                <span className="font-medium text-blue-600">Enrollment ID</span>
              </div>
              <div className="bg-white p-2 rounded border">
                <span className="font-medium text-blue-600">User ID</span>
              </div>
              <div className="bg-white p-2 rounded border">
                <span className="font-medium text-blue-600">Status</span>
                <p className="text-xs text-gray-500">present/absent</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 font-medium">⚠️ {error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-700 font-medium">✅ {successMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="space-y-6">
              <form onSubmit={handleUpload}>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="hidden"
                  id="csvFileInput"
                />

                {/* File Upload Area */}
                <div
                  onClick={handleIconClick}
                  className="cursor-pointer flex flex-col items-center justify-center border-3 border-dashed border-blue-300 rounded-2xl p-10 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 group"
                >
                  <div className="relative mb-4">
                    <FiUploadCloud size={64} className="text-blue-500 group-hover:text-blue-600 transition-colors" />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">+</span>
                    </div>
                  </div>
                  
                  <p className="text-blue-700 font-medium text-lg mb-2">
                    {file ? '✅ File Selected' : 'Click to Upload CSV'}
                  </p>
                  <p className="text-gray-600 text-sm text-center">
                    {file ? `"${file.name}"` : 'Supports .csv files only'}
                  </p>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={loading || !file}
                    className={`w-full py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                      loading || !file
                        ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </span>
                    ) : (
                      '📤 Upload Attendance CSV'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Sample Download Section */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                <h3 className="text-xl font-bold text-indigo-800 mb-4 flex items-center">
                  <FiDownload className="mr-2" />
                  Download Sample CSV
                </h3>
                
                <p className="text-gray-700 mb-6">
                  Download this sample CSV file to understand the correct format. This file contains example attendance data that you can use as a template.
                </p>

                <button
                  onClick={downloadSampleCSV}
                  className="w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                >
                  <FiDownload className="mr-2" />
                  Download Sample Format
                </button>

                <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2">Sample Data Preview:</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex">
                      <span className="w-32 font-medium">Class Name:</span>
                      <span>Web Development Batch 1</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-medium">Subject:</span>
                      <span>JavaScript Basics</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-medium">Date:</span>
                      <span>2024-01-15</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-medium">Status:</span>
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs">present/absent</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100">
                <h3 className="text-xl font-bold text-emerald-800 mb-3">📝 Instructions:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-emerald-500 mr-2">•</span>
                    <span>Date format must be <strong>YYYY-MM-DD</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-500 mr-2">•</span>
                    <span>Status must be either <strong>"present"</strong> or <strong>"absent"</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-500 mr-2">•</span>
                    <span>Do not change the column headers</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-500 mr-2">•</span>
                    <span>One row per student per class</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CSV Format Note */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <h4 className="font-semibold text-yellow-800 mb-1">⚠️ Important Notes:</h4>
            <p className="text-sm text-yellow-700">
              Make sure your CSV file follows the exact format shown above. The system will automatically detect mentor ID from your login session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadAttendanceCSV;