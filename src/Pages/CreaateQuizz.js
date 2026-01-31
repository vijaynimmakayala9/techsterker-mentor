import React, { useState, useEffect } from "react";
import axios from "axios";
import { Save, X, Plus } from "lucide-react";

const API_BASE = "https://api.techsterker.com/api";

const CreateQuizForm = ({ refreshList }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mentorId, setMentorId] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    courseId: "",
    title: "",
    description: "",
    questions: [
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        points: 1,
      },
    ],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedMentorId = localStorage.getItem("mentorId");
    if (!storedMentorId) {
      setError("Mentor not logged in");
      return;
    }
    setMentorId(storedMentorId);
    fetchCourses(storedMentorId);
  }, []);

  const fetchCourses = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/mentorenrollments/${id}`);
      const data = res.data;

      if (data?.assignedCourses?.length > 0) {
        setCourses(data.assignedCourses);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to fetch assigned courses.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...formData.questions];
    
    if (field.startsWith("options.")) {
      // For options array changes
      const optionIndex = parseInt(field.split(".")[1]);
      updatedQuestions[index].options[optionIndex] = value;
    } else {
      updatedQuestions[index][field] = value;
    }
    
    setFormData((prev) => ({
      ...prev,
      questions: updatedQuestions,
    }));
  };

  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: "",
          options: ["", "", "", ""],
          correctAnswer: "",
          points: 1,
        },
      ],
    }));
  };

  const removeQuestion = (index) => {
    if (formData.questions.length <= 1) return;
    
    const updatedQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      questions: updatedQuestions,
    }));
  };

  const addOption = (questionIndex) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options.push("");
    setFormData((prev) => ({
      ...prev,
      questions: updatedQuestions,
    }));
  };

  const removeOption = (questionIndex, optionIndex) => {
    if (formData.questions[questionIndex].options.length <= 2) return;
    
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options = updatedQuestions[
      questionIndex
    ].options.filter((_, i) => i !== optionIndex);
    
    // If correctAnswer was the removed option, clear it
    if (
      updatedQuestions[questionIndex].correctAnswer ===
      formData.questions[questionIndex].options[optionIndex]
    ) {
      updatedQuestions[questionIndex].correctAnswer = "";
    }
    
    setFormData((prev) => ({
      ...prev,
      questions: updatedQuestions,
    }));
  };

  const resetForm = () => {
    setFormData({
      courseId: "",
      title: "",
      description: "",
      questions: [
        {
          question: "",
          options: ["", "", "", ""],
          correctAnswer: "",
          points: 1,
        },
      ],
    });
    setError("");
    setSuccess("Form reset successfully!");
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(""), 3000);
  };

  const validateForm = () => {
    if (!formData.courseId || !formData.title) {
      setError("Course and Title are required");
      return false;
    }

    // Validate questions
    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i];
      
      // Check question text
      if (!q.question.trim()) {
        setError(`Question ${i + 1}: Question text is required`);
        return false;
      }

      // Check options
      const validOptions = q.options.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        setError(`Question ${i + 1}: At least 2 options are required`);
        return false;
      }

      // Check correct answer
      if (!q.correctAnswer.trim()) {
        setError(`Question ${i + 1}: Please select a correct answer`);
        return false;
      }

      // Check if correct answer exists in options
      if (!validOptions.includes(q.correctAnswer)) {
        setError(`Question ${i + 1}: Correct answer must be one of the options`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Prepare data for API
      const quizData = {
        courseId: formData.courseId,
        title: formData.title,
        description: formData.description,
        questions: formData.questions.map(q => ({
          question: q.question,
          options: q.options.filter(opt => opt.trim()), // Remove empty options
          correctAnswer: q.correctAnswer,
          points: q.points || 1,
        })),
      };

      await axios.post(
        `${API_BASE}/our-mentor/createquiz/${mentorId}`,
        quizData
      );

      setSuccess("Quiz created successfully!");
      resetForm();
      
      // Call refresh callback if provided
      if (refreshList && typeof refreshList === 'function') {
        refreshList();
      }
      
    } catch (err) {
      console.error("Error creating quiz:", err);
      setError(
        err.response?.data?.message || "Failed to create quiz. Please try again."
      );
    } finally {
      setIsSubmitting(false);
      
      // Clear messages after 5 seconds
      setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Quiz</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700">
          <p>{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Course Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Course *
          </label>
          <select
            name="courseId"
            value={formData.courseId}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">-- Select a course --</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.batchName} - {course.courseId?.description}
              </option>
            ))}
          </select>
        </div>

        {/* Quiz Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quiz Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter quiz title"
            required
          />
        </div>

        {/* Quiz Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="3"
            placeholder="Enter quiz description"
          />
        </div>

        {/* Questions Section */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Questions</h3>
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              <Plus size={18} className="mr-2" />
              Add Question
            </button>
          </div>

          {formData.questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-700">
                  Question {qIndex + 1}
                </h4>
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={formData.questions.length <= 1}
                  title={formData.questions.length <= 1 ? "Cannot remove the only question" : "Remove question"}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Question Text */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Text *
                </label>
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) =>
                    handleQuestionChange(qIndex, "question", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your question here"
                  required
                />
              </div>

              {/* Options */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options *
                </label>
                <div className="space-y-2">
                  {q.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center">
                      <span className="mr-2 text-gray-600">{oIndex + 1}.</span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) =>
                          handleQuestionChange(
                            qIndex,
                            `options.${oIndex}`,
                            e.target.value
                          )
                        }
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`Option ${oIndex + 1}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(qIndex, oIndex)}
                        className="ml-2 p-1 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={q.options.length <= 2}
                        title={q.options.length <= 2 ? "At least 2 options required" : "Remove option"}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addOption(qIndex)}
                  className="mt-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Option
                </button>
              </div>

              {/* Correct Answer and Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correct Answer *
                  </label>
                  <select
                    value={q.correctAnswer}
                    onChange={(e) =>
                      handleQuestionChange(
                        qIndex,
                        "correctAnswer",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">-- Select correct answer --</option>
                    {q.options
                      .filter((opt) => opt.trim())
                      .map((option, index) => (
                        <option key={index} value={option}>
                          Option {index + 1}: {option}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={q.points}
                    onChange={(e) =>
                      handleQuestionChange(
                        qIndex,
                        "points",
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Points awarded for correct answer
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Form Actions */}
        <div className="flex space-x-4 pt-4 border-t">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Save size={20} className="mr-2" />
            {isSubmitting ? "Creating Quiz..." : "Create Quiz"}
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset Form
          </button>
        </div>

        <div className="text-sm text-gray-500 pt-4 border-t">
          <p className="font-medium">Tips:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Each question must have at least 2 options</li>
            <li>Select the correct answer from the options</li>
            <li>Points determine the weight of each question</li>
            <li>You can add multiple questions using "Add Question" button</li>
          </ul>
        </div>
      </form>
    </div>
  );
};

export default CreateQuizForm;