import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const InterviewPracticePage = () => {
  const [interviewData, setInterviewData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const loadingTimeoutRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Persist interview data in sessionStorage to prevent loss
  useEffect(() => {
    if (interviewData) {
      sessionStorage.setItem("interviewData", JSON.stringify(interviewData));
    }
  }, [interviewData]);

  const requestInterviewData = useCallback(() => {
    console.log("[InterviewPracticePage] Requesting interview data from main process");
    window.api.send("request-interview-data");
  }, []);

  useEffect(() => {
    console.log("[InterviewPracticePage] Initial render effect");

    // Prevent multiple initializations
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    setIsLoading(true);
    
    // Setup loading timeout to request data if not received
    loadingTimeoutRef.current = setTimeout(() => {
      if (!interviewData) {
        requestInterviewData();
      }
    }, 5000);
    
    // Check for cached data in sessionStorage - FIRST PRIORITY
    const cachedData = sessionStorage.getItem("interviewData");
    if (cachedData) {
      try {
        console.log("[InterviewPracticePage] Using cached interview data");
        const parsedData = JSON.parse(cachedData);
        setInterviewData(parsedData);
        setIsLoading(false);
        clearTimeout(loadingTimeoutRef.current);
      } catch (e) {
        console.error("[InterviewPracticePage] Failed to parse cached data", e);
      }
    }

    const handleShowInterviewScreen = (data) => {
      console.log("[InterviewPracticePage] Received interview data:", data);
      
      // Clear any loading timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      // Ensure full data is set
      setInterviewData(prevData => {
        // Merge new data with previous data if needed
        const mergedData = prevData ? { ...prevData, ...data } : data;
        
        // Always ensure questions are set
        if (data.questions) {
          mergedData.questions = data.questions;
        }
        
        console.log("[InterviewPracticePage] Merged interview data:", mergedData);
        return mergedData;
      });
      
      setCurrentIndex(0);
      setIsLoading(false);
    };

    const handleQuestionIndex = (payload) => {
      console.log("[InterviewPracticePage] Received question-index payload:", payload);
      
      const index = payload?.index;
      console.log("[InterviewPracticePage] Extracted index:", index);
      
      // First, check cached data if current interview data is null
      const cachedData = sessionStorage.getItem("interviewData");
      let currentData = interviewData;
      
      if (!currentData && cachedData) {
        try {
          currentData = JSON.parse(cachedData);
          setInterviewData(currentData);
          console.log("[InterviewPracticePage] Restored data from cache:", currentData);
        } catch (e) {
          console.error("[InterviewPracticePage] Failed to parse cached data", e);
        }
      }
      
      if (typeof index === "number") {
        console.log("[InterviewPracticePage] Index is a number");
        
        if (currentData?.questions?.length > 0) {
          console.log("[InterviewPracticePage] Questions exist");
          const safeIndex = Math.max(0, Math.min(index, currentData.questions.length - 1));
          console.log("[InterviewPracticePage] Safe index calculated:", safeIndex);
          
          setCurrentIndex(safeIndex);
        } else {
          console.warn("[InterviewPracticePage] No questions found in interview data");
        }
      } else {
        console.warn("[InterviewPracticePage] Received invalid index:", index);
      }
    };

    // Add event listeners
    window.api.on("show-interview-screen", handleShowInterviewScreen);
    window.api.on("question-index", handleQuestionIndex);

    return () => {
      // Remove event listeners
      window.api.removeListener("show-interview-screen", handleShowInterviewScreen);
      window.api.removeListener("question-index", handleQuestionIndex);
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      isInitializedRef.current = false;
    };
  }, []); // Empty dependency array to run only once

  // Optional: effect to handle index changes with more logging
  useEffect(() => {
    console.log("[InterviewPracticePage] Index change effect triggered");
    console.log("Current Index:", currentIndex);
    
    if (interviewData?.questions) {
      console.log("Current Question:", interviewData.questions[currentIndex]);
    }
  }, [interviewData, currentIndex]);

  // Loading screen with retry button
  if (isLoading || !interviewData) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <p className="text-gray-400 mb-4">Waiting for questions from controller...</p>
        <button 
          onClick={requestInterviewData} 
          className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Retry Loading Questions
        </button>
      </div>
    );
  }

  const { topic, questions } = interviewData;
  const question = questions[currentIndex];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-bold absolute top-6 left-6">Interview: {topic}</h1>

      <div className="max-w-4xl">
        <div className="mb-8">
          <p className="text-2xl font-semibold mb-4">
            {questions.length > 0 ? `${currentIndex + 1} of ${questions.length}` : "Loading..."}
          </p>
          <p className="text-2xl font-semibold mb-4">
            {currentIndex + 1}. {question.question}
          </p>
          <p className="text-sm text-gray-400">{question.answer}</p>
        </div>
      </div>
    </div>
  );
};

export default InterviewPracticePage;