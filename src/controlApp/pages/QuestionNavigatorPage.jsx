import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
// import dotenv from "dotenv";

const QuestionNavigatorPage = () => {
  const [interviewData, setInterviewData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recordingState, setRecordingState] = useState("idle");
  const [transcriptions, setTranscriptions] = useState(() => {
    const saved = sessionStorage.getItem("transcriptions");
    return saved ? JSON.parse(saved) : {};
  });
  const [transcription, setTranscription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const loadingTimeoutRef = useRef(null); 

  const currentIndexRef = useRef(currentIndex);
  const transcriptionsRef = useRef(transcriptions);

  const navigate = useNavigate();
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

    // dotenv.config();

    const API_URL =  "http://localhost:5030";

  // Memoized request interview data function
  const requestInterviewData = useCallback(() => {
    console.log("[QuestionNavigatorPage] Requesting interview data from main process");
    window.api.send("request-interview-data");
    
    // Set a new timeout for the next retry if needed
    loadingTimeoutRef.current = setTimeout(() => {
      if (!interviewData) {
        requestInterviewData();
      }
    }, 10000); // Retry every 10 seconds until data is received
  }, [interviewData]);

  // Function to speak text using the API
  const speakText = useCallback(async (text) => {
    if (!text) return;
    
    try {
      const response = await fetch(`${API_URL}/speak`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      const result = await response.json();
      if (!result.success) {
        console.error("[QuestionNavigatorPage] Speech API error:", result.error);
      }
    } catch (error) {
      console.error("[QuestionNavigatorPage] Failed to call speech API:", error);
    }
  }, []);

  // Update refs when state changes
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    transcriptionsRef.current = transcriptions;
    // Save transcriptions to sessionStorage whenever they change
    sessionStorage.setItem('transcriptions', JSON.stringify(transcriptions));
  }, [transcriptions]);

  // Initialize and set up event listeners
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    
    // Setup loading timeout to request data if not received
    loadingTimeoutRef.current = setTimeout(() => {
      if (!interviewData) {
        requestInterviewData();
      }
    }, 3000); // Wait 3 seconds before first retry

    const handleInterviewData = (data) => {
      if (!isMounted) return;

      console.log("[QuestionNavigatorPage] Received interview data:", data);
      
      // Clear any loading timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      if (data && data.questions && Array.isArray(data.questions)) {
        setInterviewData(data);
        setCurrentIndex(0);
        setIsLoading(false);
        
        // Cache the data in sessionStorage
        sessionStorage.setItem("interviewData", JSON.stringify(data));
        
        // Set initial transcription if available
        const savedTranscriptions = transcriptionsRef.current;
        setTranscription(savedTranscriptions[0] || "");
        
        // Send initial question index to main process
        setTimeout(() => sendQuestionIndex(0), 100);
      } else {
        console.error("[QuestionNavigatorPage] Invalid interview data format:", data);
      }
    };

    const handleTranscriptionComplete = (result) => {
      if (!isMounted) return;

      console.log("[QuestionNavigatorPage] Transcription result:", result);
      
      // Update transcriptions state with new result
      const idx = result.questionIndex;
      const updated = { ...transcriptionsRef.current, [idx]: result.text };
      setTranscriptions(updated);
      
      // Update current transcription if user is still on the same question
      if (idx === currentIndexRef.current) {
        setTranscription(result.text);
        
        // Speak out the transcription result
        speakText("Answer transcribed");
      }
      
      // Reset recording state
      setRecordingState("idle");
    };

    // Set up event listeners for communication with main process
    window.api.on("interview-data", handleInterviewData);
    window.api.on("transcription-complete", handleTranscriptionComplete);

    // Load cached interview data if available
    const cachedData = sessionStorage.getItem("interviewData");
    if (cachedData) {
      try {
        console.log("[QuestionNavigatorPage] Using cached interview data");
        const parsedData = JSON.parse(cachedData);
        handleInterviewData(parsedData);
      } catch (e) {
        console.error("Failed to parse cached interview data", e);
      }
    }

    // Clean up on unmount
    return () => {
      isMounted = false;
      
      // Precisely remove the specific listener functions
      window.api.removeListener("interview-data", handleInterviewData);
      window.api.removeListener("transcription-complete", handleTranscriptionComplete);
      
      stopRecording();
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []); //

  // Helper function to send current question index to main process
  const sendQuestionIndex = (index) => {
    if (!interviewData?.questions) return;
    window.api.send("question-index", { index });
  };

  // Navigation handlers
  const handlePrev = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setTranscription(transcriptionsRef.current[newIndex] || "");
      sendQuestionIndex(newIndex);
      
      // Speak the question when navigating to previous question
      if (interviewData && interviewData.questions[newIndex]) {
        speakText(interviewData.questions[newIndex].question);
      }
    }
  };

  const handleNext = () => {
    if (interviewData && currentIndex < interviewData.questions.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setTranscription(transcriptionsRef.current[newIndex] || "");
      sendQuestionIndex(newIndex);
      
      // Speak the question when navigating to next question
      if (interviewData && interviewData.questions[newIndex]) {
        speakText(interviewData.questions[newIndex].question);
      }
    } else if (interviewData && currentIndex >= interviewData.questions.length - 1) {
      // When the last question is done, navigate to review answers page
      navigate('/review-answers');
    }
  };

  // Trigger text-to-speech for current question
  const handleSpeakQuestion = () => {
    if (interviewData && interviewData.questions[currentIndex]) {
      speakText(interviewData.questions[currentIndex].question);
    }
  };

  // Recording functionality
  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      // Set up data collection
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Set up stop handler
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        saveRecording(audioBlob);
        
        // Clean up media tracks
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording
      mediaRecorderRef.current.start();
      setRecordingState("recording");
      
      // Clear current transcription while recording
      setTranscription("");

      // Speak a message when recording starts
      speakText("Recording started");

      console.log("[QuestionNavigatorPage] Recording started");
    } catch (error) {
      console.error("[QuestionNavigatorPage] Error starting recording:", error);
      setRecordingState("idle");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      speakText("Recording stopped");
      console.log("[QuestionNavigatorPage] Recording stopped");
    }
  };

  // Send audio data to main process for transcription
  const saveRecording = async (audioBlob) => {
    setRecordingState("transcribing");

    try {
      const reader = new FileReader();
      reader.readAsArrayBuffer(audioBlob);

      reader.onloadend = () => {
        const arrayBuffer = reader.result;
        
        // Send to main process for transcription
        window.api.send("transcribe-audio", {
          buffer: arrayBuffer,
          questionIndex: currentIndexRef.current,
        });

        console.log("[QuestionNavigatorPage] Audio sent for transcription");
      };
    } catch (error) {
      console.error("[QuestionNavigatorPage] Error saving recording:", error);
      setRecordingState("idle");
    }
  };

  // Toggle recording state
  const handleToggleRecording = () => {
    if (recordingState === "idle") {
      startRecording();
    } else if (recordingState === "recording") {
      stopRecording();
    }
  };

  // UI helper functions
  const getRecordButtonText = () => {
    switch (recordingState) {
      case "recording":
        return "Stop Recording";
      case "transcribing":
        return "Transcribing...";
      default:
        return "Start Recording";
    }
  };

const getRecordButtonClass = () => {
  switch (recordingState) {
    case "recording":
      return "bg-red-600 hover:bg-red-500 border-4 border-red-500 text-white";
    case "transcribing":
      return "bg-yellow-600 border-4 border-yellow-400 cursor-wait text-white";
    default: // not recording
      return "bg-gray-800 hover:bg-gray-700 border-4 border-red-600 text-white";
  }
};

  // Loading screen with retry button
  if (isLoading || !interviewData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
        <h1 className="text-xl font-semibold mb-6">Question Controller</h1>
        <p className="text-gray-300 mb-8">Waiting for interview data...</p>
        <button
          onClick={requestInterviewData}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium"
        >
          Retry Loading Interview
        </button>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-gray-300 hover:text-white bg-gray-800 px-4 py-2 rounded-lg font-medium"
        >
          ← Back to Home
        </button>
      </div>
    );
  }

  const totalQuestions = interviewData.questions.length;
  const currentQuestion = interviewData.questions[currentIndex];
return (
  <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 relative">
    {/* Back to Home Button */}
    <button 
      onClick={() => {
        // Send IPC to display app
        if (window.api) {
          window.api.send("navigate", { path: "/" });
          console.log("Sent to display:", "/");
        } else {
          console.error("IPC not available");
        }
        
        // Also navigate in React
        navigate('/');
      }}
      className="absolute top-6 left-6 bg-gray-700 hover:bg-gray-600 px-6 py-5 rounded-md flex items-center text-2xl"
    >
      <span className="mr-3">←</span> Back
    </button>
      
    <div className="w-full max-w-full bg-gray-800 p-8 rounded-xl shadow-lg">
      <p className="text-lg mb-6 text-gray-400">Question {currentIndex + 1}/{totalQuestions}</p>

      <div className="mb-6">
        <div className="w-full bg-gray-700 p-6 rounded-md min-h-[100px] text-white text-lg whitespace-pre-wrap">
          {transcription || "No answer recorded yet."}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-6">
        <button
          onClick={handleSpeakQuestion}
          className="bg-indigo-600 hover:bg-indigo-500 px-6 py-8 rounded-md font-semibold text-2xl flex items-center justify-center"
        >
          🔊 Hear Question
        </button>
        
        <button
          onClick={handleToggleRecording}
          className={`text-white px-6 py-8 rounded-md font-semibold text-2xl flex items-center justify-center ${getRecordButtonClass()}`}
        >
          🎤 {getRecordButtonText()}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 px-6 py-8 rounded-md text-2xl"
        >
          ← Previous
        </button>

        <button
          onClick={handleNext}
          className="bg-green-600 hover:bg-green-500 px-6 py-8 rounded-md text-2xl"
        >
          {currentIndex === totalQuestions - 1 ? "Finish →" : "Next →"}
        </button>
      </div>
    </div>
  </div>
);
};

export default QuestionNavigatorPage;