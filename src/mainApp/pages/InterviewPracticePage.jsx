import React, { useEffect, useState } from "react";

const InterviewPracticePage = () => {
  const [interviewData, setInterviewData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for cached data in sessionStorage
    const cachedData = sessionStorage.getItem("interviewData");
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        setInterviewData(parsedData);
        setIsLoading(false);
      } catch (e) {
        console.error("[InterviewPracticePage] Failed to parse cached data", e);
      }
    }

    // Listen for interview screen data
    const handleShowInterviewScreen = (data) => {
      console.log("[InterviewPracticePage] Received interview data:", data);
      
      // Cache the data in sessionStorage
      sessionStorage.setItem("interviewData", JSON.stringify(data));
      
      setInterviewData(data);
      setCurrentIndex(0);
      setIsLoading(false);
    };

    // Listen for question index changes
    const handleQuestionIndex = (payload) => {
      const index = payload?.index;
      if (interviewData?.questions?.length > 0 && typeof index === "number") {
        const safeIndex = Math.max(0, Math.min(index, interviewData.questions.length - 1));
        setCurrentIndex(safeIndex);
      }
    };

    // Add event listeners
    window.api.on("show-interview-screen", handleShowInterviewScreen);
    window.api.on("question-index", handleQuestionIndex);

    // Cleanup listeners
    return () => {
      window.api.removeListener("show-interview-screen", handleShowInterviewScreen);
      window.api.removeListener("question-index", handleQuestionIndex);
    };
  }, []);

  // Loading screen
  if (isLoading || !interviewData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Loading interview questions...</p>
      </div>
    );
  }

  const { topic, questions } = interviewData;
  const question = questions[currentIndex];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-bold absolute top-6 left-6">Interview: {topic}</h1>

      <div className="max-w-4xl w-full">
        <div className="mb-8">
          <p className="text-2xl font-semibold mb-4">
            {currentIndex + 1}. {question.question}
          </p>
          <div className="mt-6 text-left">
            <h3 className="text-xl font-semibold mb-2 text-gray-300">Model Answer:</h3>
            <p className="text-gray-400 whitespace-pre-wrap">{question.answer}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPracticePage;