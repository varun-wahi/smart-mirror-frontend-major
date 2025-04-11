import React, { useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Volume2, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QuestionNavigatorPage = () => {
  const [interviewData, setInterviewData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMicOn, setIsMicOn] = useState(false);
  const navigate = useNavigate();
  const audioRef = React.useRef(null);

  useEffect(() => {
    // Create audio element for mic sound
    audioRef.current = new Audio('sounds/mic_on.mp3');
    
    // Handler for receiving interview data
    const handleInterviewData = (data) => {
      console.log("[QuestionNavigatorPage] Received interview data:", data);
      if (data && data.questions && Array.isArray(data.questions)) {
        setInterviewData(data);
        setCurrentIndex(0);
        // Send initial question index after slight delay to ensure both windows are ready
        setTimeout(() => sendQuestionIndex(0), 100);
      } else {
        console.error("[QuestionNavigatorPage] Invalid interview data format:", data);
      }
    };

    // Register listeners - IMPORTANT: We need to set this up each time the component mounts
    window.api.on("interview-data", handleInterviewData);

    // Check if there's any cached data in sessionStorage
    const cachedData = sessionStorage.getItem('interviewData');
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        handleInterviewData(parsedData);
      } catch (e) {
        console.error("Failed to parse cached interview data", e);
      }
    }

    // Clean up listeners on unmount
    return () => {
      window.api.removeAllListeners("interview-data");
    };
  }, []);

  // Save interview data to sessionStorage whenever it changes
  useEffect(() => {
    if (interviewData) {
      sessionStorage.setItem('interviewData', JSON.stringify(interviewData));
    }
  }, [interviewData]);

  const sendQuestionIndex = (index) => {
    if (!interviewData || !interviewData.questions) {
      console.warn("[QuestionNavigatorPage] Cannot send index, no interview data available");
      return;
    }
    
    console.log("[QuestionNavigatorPage] Sending question index:", index);
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
    setIsMicOn(prevState => !prevState);
    
    // Play the microphone sound
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Reset to beginning
      audioRef.current.play().catch(err => console.error("Error playing mic sound:", err));
    }
    
    // Here you would add actual microphone functionality if needed
    console.log("Microphone toggled:", !isMicOn);
  };

  // Calculate total questions based on available data
  const totalQuestions = interviewData?.questions?.length || 0;

  return (
    <div className="h-screen flex flex-col bg-black text-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-700 flex items-center justify-between">
        <button
          onClick={() => {
            window.api.send('navigate', { path: "/" });
            navigate("/");
          }}
          className="text-gray-400 hover:text-white flex items-center"
        >
          <ArrowLeft className="mr-2" size={18} />
          Back to Home
        </button>
        <h1 className="text-xl font-semibold">Question Controller</h1>
        <div>{interviewData ? `${interviewData.topic} - ${interviewData.difficulty}` : ""}</div>
      </div>
  
      {/* Content */}
      <div className="flex-1 flex flex-col p-6 justify-center items-center">
        <div className="text-gray-400 text-lg mb-4">
          Question {totalQuestions > 0 ? currentIndex + 1 : 0} of {totalQuestions}
        </div>
  
        <div className="relative w-full h-[60vh] flex items-center">
          {/* Prev Button - Left */}
          <div className="absolute left-0 h-full flex items-center">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0 || totalQuestions === 0}
              className={`flex items-center justify-center h-32 w-32 rounded-full text-2xl font-bold transition ${
                currentIndex === 0 || totalQuestions === 0
                  ? "bg-gray-700/50 text-gray-400 cursor-not-allowed"
                  : "bg-blue-700 hover:bg-blue-600"
              }`}
            >
              <ChevronLeft size={48} />
            </button>
          </div>
  
          {/* Speaker & Mic - Center */}
          <div className="flex flex-col items-center justify-center mx-auto gap-10">
            <button 
              onClick={handleSpeakQuestion}
              className="flex items-center justify-center p-6 rounded-full bg-gray-800 hover:bg-gray-700 transition"
            >
              <Volume2 size={32} className="text-white" />
            </button>
  
            <button 
              onClick={handleToggleMic}
              className={`flex items-center justify-center p-6 rounded-full transition ${
                isMicOn 
                  ? "bg-red-600 hover:bg-red-500" 
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              <Mic size={32} className="text-white" />
            </button>
          </div>
  
          {/* Next Button - Right */}
          <div className="absolute right-0 h-full flex items-center">
            <button
              onClick={handleNext}
              disabled={currentIndex >= totalQuestions - 1 || totalQuestions === 0}
              className={`flex items-center justify-center h-32 w-32 rounded-full text-2xl font-bold transition ${
                currentIndex >= totalQuestions - 1 || totalQuestions === 0
                  ? "bg-gray-700/50 text-gray-400 cursor-not-allowed"
                  : "bg-teal-600 hover:bg-teal-500"
              }`}
            >
              <ChevronRight size={48} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionNavigatorPage;