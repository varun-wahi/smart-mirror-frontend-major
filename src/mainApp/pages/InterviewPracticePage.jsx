import React, { useState, useEffect } from "react";
import { useInterview } from "../utils/InterviewContext";


const InterviewPracticePage = () => {
  const { interviewData } = useInterview();
  const { topic, difficulty, questionCount } = interviewData;

  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const url = process.env.REACT_APP_LOCAL_BACKEND_URL || "http://localhost:5020";

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    console.log("Fetching questions...");
    console.log("No of questions:", questionCount);
    try {
      const response = await fetch(`${url}/api/interview/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          difficulty: difficulty.toLowerCase(), // Convert to lowercase if needed
          numQuestions: questionCount,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch questions");

      const data = await response.json();
      setQuestions(data.questions);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [topic, difficulty, questionCount]);

  // Render loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-gray-500 border-opacity-50"></div>
        <p className="mt-4 text-gray-400 text-sm font-light">It might take a while to load...</p>
      </div>
    );
  }

  // Render error message
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <p className="text-red-500 font-medium">Error: {error}</p>
        <button
          onClick={fetchQuestions}
          className="mt-4 bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  // Render questions
  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Interview Questions: React</h1>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {questions?.map((q, index) => (
          <div key={index} className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <p className="text-lg font-medium mb-2">{index + 1}. {q.question}</p>
            <p className="text-sm text-gray-400">{q.answer}</p>
          </div>
        ))}
      </div>

      {/* More Questions Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={fetchQuestions}
          className="bg-teal-600 hover:bg-teal-500 text-white py-2 px-6 rounded-lg shadow-lg transition"
        >
          More Questions
        </button>
      </div>
    </div>
  );
};

export default InterviewPracticePage;