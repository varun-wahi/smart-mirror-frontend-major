import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

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
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Update refs when state changes
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    transcriptionsRef.current = transcriptions;
    // Save transcriptions to sessionStorage whenever they change
    sessionStorage.setItem('transcriptions', JSON.stringify(transcriptions));
  }, [transcriptions]);

  // Function to request data if it hasn't arrived after a timeout
  const requestInterviewData = () => {
    console.log("[QuestionNavigatorPage] Requesting interview data from main process");
    window.api.send("request-interview-data");
    
    // Set a new timeout for the next retry if needed
    loadingTimeoutRef.current = setTimeout(() => {
      if (!interviewData) {
        requestInterviewData();
      }
    }, 5000); // Retry every 5 seconds until data is received
  };

  // Initialize and set up event listeners
  useEffect(() => {
    setIsLoading(true);
    
    // Setup loading timeout to request data if not received
    loadingTimeoutRef.current = setTimeout(() => {
      if (!interviewData) {
        requestInterviewData();
      }
    }, 3000); // Wait 3 seconds before first retry
    
    // Load audio feedback sound
    audioRef.current = new Audio("sounds/mic_on.mp3");

    const handleInterviewData = (data) => {
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

    // Set up event listeners for communication with main process
    window.api.on("interview-data", handleInterviewData);

    // Handle transcription results coming back from main process
    window.api.on("transcription-complete", (result) => {
      console.log("[QuestionNavigatorPage] Transcription result:", result);
      
      // Update transcriptions state with new result
      const idx = result.questionIndex;
      const updated = { ...transcriptionsRef.current, [idx]: result.text };
      setTranscriptions(updated);
      
      // Update current transcription if user is still on the same question
      if (idx === currentIndexRef.current) {
        setTranscription(result.text);
      }
      
      // Play audio feedback
      playTranscribedAudio(result.text);
      
      // Reset recording state
      setRecordingState("idle");
    });

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
      window.api.removeAllListeners("interview-data");
      window.api.removeAllListeners("transcription-complete");
      stopRecording();
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

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
    }
  };

  const handleNext = () => {
    if (interviewData && currentIndex < interviewData.questions.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setTranscription(transcriptionsRef.current[newIndex] || "");
      sendQuestionIndex(newIndex);
    } else if (interviewData && currentIndex >= interviewData.questions.length - 1) {
      // When the last question is done, navigate to review answers page
      navigate('/review-answers');
    }
  };

  // Trigger text-to-speech for current question
  const handleSpeakQuestion = () => {
    window.api.send("speak-question");
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

      // Play audio feedback
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => console.error("Mic sound error:", err));
      }

      console.log("[QuestionNavigatorPage] Recording started");
    } catch (error) {
      console.error("[QuestionNavigatorPage] Error starting recording:", error);
      setRecordingState("idle");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
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

  // Play audio feedback after transcription
  const playTranscribedAudio = (text) => {
    console.log("[QuestionNavigatorPage] Transcribed text:", text);

    // Speak confirmation using speech synthesis
    const utterance = new SpeechSynthesisUtterance("Answer transcribed");
    speechSynthesis.speak(utterance);
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
        return "bg-red-600 hover:bg-red-500 border-2 border-red-400";
      case "transcribing":
        return "bg-yellow-600 border-2 border-yellow-400 cursor-wait";
      default:
        return "bg-gray-800 hover:bg-gray-700";
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
  <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
    <h1 className="text-2xl font-bold mb-4">Interview Questions</h1>
    
    <div className="w-full max-w-3xl bg-gray-800 p-6 rounded-xl shadow-lg">
      <p className="text-lg mb-4">
  <span className="text-gray-400">Question {currentIndex + 1} of {totalQuestions}:</span><br />
  <span className="text-white font-medium">{currentQuestion.question}</span>
</p>

      <div className="mb-4">
        <label className="block text-gray-300 text-sm mb-1">Your Answer:</label>
        <div className="w-full bg-gray-700 p-4 rounded-md min-h-[80px] text-white whitespace-pre-wrap">
          {transcription || "No answer recorded yet."}
        </div>
      </div>

      <div className="flex gap-4 mt-4 flex-wrap justify-between">
        <button
          onClick={handleSpeakQuestion}
          className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-md font-medium"
        >
          🔊 Hear Question
        </button>
        
        <button
          onClick={handleToggleRecording}
          className={`text-white px-4 py-2 rounded-md font-medium ${getRecordButtonClass()}`}
        >
          🎤 {getRecordButtonText()}
        </button>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 px-4 py-2 rounded-md"
        >
          ← Previous
        </button>

        <button
          onClick={handleNext}
          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-md"
        >
          {currentIndex === totalQuestions - 1 ? "Finish →" : "Next →"}
        </button>
      </div>
    </div>
  </div>
);
};
export default QuestionNavigatorPage;