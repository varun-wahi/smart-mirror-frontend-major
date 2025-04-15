import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const QuestionNavigatorPage = () => {
  const [interviewData, setInterviewData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMicOn, setIsMicOn] = useState(false);
  const navigate = useNavigate();
  const audioRef = React.useRef(null);

  useEffect(() => {
    audioRef.current = new Audio('sounds/mic_on.mp3');

    const handleInterviewData = (data) => {
      console.log("[QuestionNavigatorPage] Received interview data:", data);
      if (data && data.questions && Array.isArray(data.questions)) {
        setInterviewData(data);
        setCurrentIndex(0);
        setTimeout(() => sendQuestionIndex(0), 100);
      } else {
        console.error("[QuestionNavigatorPage] Invalid interview data format:", data);
      }
    };

    window.api.on("interview-data", handleInterviewData);

    const cachedData = sessionStorage.getItem('interviewData');
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        handleInterviewData(parsedData);
      } catch (e) {
        console.error("Failed to parse cached interview data", e);
      }
    }

    return () => {
      window.api.removeAllListeners("interview-data");
    };
  }, []);

  useEffect(() => {
    if (interviewData) {
      sessionStorage.setItem('interviewData', JSON.stringify(interviewData));
    }
  }, [interviewData]);

  const sendQuestionIndex = (index) => {
    if (!interviewData?.questions) return;
    window.api.send("question-index", { index });
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      sendQuestionIndex(newIndex);
    }
  };

  const handleNext = () => {
    if (interviewData && currentIndex < interviewData.questions.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      sendQuestionIndex(newIndex);
    }
  };

  const handleSpeakQuestion = () => {
    window.api.send("speak-question");
  };

  const handleToggleMic = () => {
    setIsMicOn((prev) => !prev);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.error("Mic sound error:", err));
    }
  };

  const totalQuestions = interviewData?.questions?.length || 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
        <button
          onClick={() => navigate("/")}
          className="text-gray-300 hover:text-white bg-gray-800 px-4 py-2 rounded-lg font-medium flex items-center"
        >
          ← Back to Home
        </button>
        <h1 className="text-lg md:text-xl font-semibold text-center">Question Controller</h1>
        <div className="bg-gray-800 px-4 py-2 rounded-lg text-sm md:text-base text-center">
          {interviewData ? `${interviewData.topic} - ${interviewData.difficulty}` : ""}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-8 text-base md:text-lg bg-gray-800 px-6 py-3 rounded-full">
          Question {totalQuestions > 0 ? currentIndex + 1 : 0} of {totalQuestions}
        </div>

        {/* Action Buttons - Speak and Mic */}
        <div className="w-full max-w-md mx-auto mb-12 space-y-6">
          {/* Speak Button */}
          <button
            onClick={handleSpeakQuestion}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white text-xl font-medium py-6 rounded-lg transition"
          >
             Read Question
          </button>

          {/* Mic Button */}
          <button
            onClick={handleToggleMic}
            className={`w-full text-xl font-medium py-6 rounded-lg transition ${
              isMicOn 
                ? "bg-red-600 hover:bg-red-500 border-2 border-red-400" 
                : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            {isMicOn ? " Stop Recording" : " Start Recording"}
          </button>
        </div>

        {/* Navigation Buttons - Previous and Next in a single row */}
        <div className="w-full flex justify-between gap-6 max-w-3xl">
          {/* Prev Button - More prominent */}
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0 || totalQuestions === 0}
            className={`flex-1 text-xl md:text-xl font-bold py-6 rounded-lg transition border-3 ${
              currentIndex === 0 || totalQuestions === 0
                ? "bg-gray-700 text-gray-500 border-gray-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white border-blue-400"
            }`}
          >
             Previous 
          </button>

          {/* Next Button - More prominent */}
          <button
            onClick={handleNext}
            disabled={currentIndex >= totalQuestions - 1 || totalQuestions === 0}
            className={`flex-1 text-xl md:text-xl font-bold py-6 rounded-lg transition border-3 ${
              currentIndex >= totalQuestions - 1 || totalQuestions === 0
                ? "bg-gray-700 text-gray-500 border-gray-600 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-500 text-white border-teal-400"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionNavigatorPage;