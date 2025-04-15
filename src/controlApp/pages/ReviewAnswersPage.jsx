import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ReviewAnswersPage = () => {
  const [interviewData, setInterviewData] = useState(null);
  const [transcriptions, setTranscriptions] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const storedData = sessionStorage.getItem('interviewData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setInterviewData(parsedData);
    }

    const storedTranscriptions = JSON.parse(sessionStorage.getItem('transcriptions') || '{}');
    setTranscriptions(storedTranscriptions);
  }, []);

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <div className="p-4 md:p-6 border-b border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
        <button
          onClick={handleBackToHome}
          className="text-gray-300 hover:text-white bg-gray-800 px-4 py-2 rounded-lg font-medium flex items-center"
        >
          ← Back to Home
        </button>
        <h1 className="text-lg md:text-xl font-semibold text-center">Review Answers</h1>
      </div>

      <div className="flex-1 p-6">
        <div className="mb-8 text-base md:text-lg bg-gray-800 px-6 py-3 rounded-full">
          Review your answers below:
        </div>

        {interviewData?.questions?.map((qObj, index) => (
          <div key={index} className="mb-6">
            <div className="bg-gray-800 p-4 rounded-lg">
              <strong>Question {index + 1}:</strong> {qObj.question}
            </div>
            <div className="bg-gray-700 p-4 mt-2 rounded-lg">
              <strong>Your Answer:</strong> {transcriptions[index] || "No transcription available"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewAnswersPage;
