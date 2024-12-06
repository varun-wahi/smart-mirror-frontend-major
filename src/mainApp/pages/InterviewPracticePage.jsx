import React, { useState, useEffect } from "react";

const InterviewPracticePage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch interview questions from the backend
    const fetchQuestions = async () => {
      try {
        const response = await fetch(
          "https://smart-mirror-backend.vercel.app/api/interview/questions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              topic: "React js",
              difficulty: "intermediate",
              numQuestions: 10,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        setQuestions(data.questions); // Store the questions
      } catch (err) {
        setError(err.message); // Set error message
      } finally {
        setLoading(false); // Stop loading spinner
      }
    };

    fetchQuestions();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <h1 className="text-3xl font-bold">Loading questions...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <h1 className="text-3xl font-bold text-red-500">Error: {error}</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-4xl font-bold mb-6 text-center">
        Interview Questions
      </h1>
      <div className="space-y-6">
        {questions.map((q, index) => (
          <div
            key={index}
            className="bg-gray-800 p-6 rounded-lg shadow-md hover:bg-gray-700 transition"
          >
            <h2 className="text-xl font-semibold mb-4">
              Q{index + 1}: {q.question}
            </h2>
            <p className="text-gray-300">{q.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterviewPracticePage;