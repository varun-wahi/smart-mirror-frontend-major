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

  // Initialize and set up event listeners
  useEffect(() => {
    // Load audio feedback sound
    audioRef.current = new Audio("sounds/mic_on.mp3");

    const handleInterviewData = (data) => {
      console.log("[QuestionNavigatorPage] Received interview data:", data);
      if (data && data.questions && Array.isArray(data.questions)) {
        setInterviewData(data);
        setCurrentIndex(0);
        
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
    };
  }, []);

  // Save interview data to session storage when it changes
  useEffect(() => {
    if (interviewData) {
      sessionStorage.setItem("interviewData", JSON.stringify(interviewData));
    }
  }, [interviewData]);

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

  const totalQuestions = interviewData?.questions?.length || 0;
  const isLastQuestion = currentIndex >= totalQuestions - 1;

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
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

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-8 text-base md:text-lg bg-gray-800 px-6 py-3 rounded-full">
          Question {totalQuestions > 0 ? currentIndex + 1 : 0} of {totalQuestions}
        </div>

        {transcription && (
          <div className="mb-8 bg-gray-800 p-4 rounded-lg text-base max-w-3xl w-full">
            <strong>Transcription:</strong> {transcription}
          </div>
        )}

        <div className="w-full max-w-md mx-auto mb-12 space-y-6">
          <button
            onClick={handleSpeakQuestion}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white text-xl font-medium py-6 rounded-lg transition"
            disabled={recordingState === "transcribing"}
          >
            Read Question
          </button>

          <button
            onClick={handleToggleRecording}
            disabled={recordingState === "transcribing"}
            className={`w-full text-xl font-medium py-6 rounded-lg transition ${getRecordButtonClass()}`}
          >
            {getRecordButtonText()}
          </button>
        </div>

        <div className="w-full flex justify-between gap-6 max-w-3xl">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0 || totalQuestions === 0 || recordingState === "transcribing" || recordingState === "recording"}
            className={`flex-1 text-xl md:text-xl font-bold py-6 rounded-lg transition border-3 ${
              currentIndex === 0 || totalQuestions === 0 || recordingState === "transcribing" || recordingState === "recording"
                ? "bg-gray-700 text-gray-500 border-gray-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white border-blue-400"
            }`}
          >
            Previous
          </button>

          {isLastQuestion ? (
            <button
              onClick={() => navigate('/review-answers')}
              disabled={recordingState === "transcribing" || recordingState === "recording"}
              className={`flex-1 text-xl md:text-xl font-bold py-6 rounded-lg transition ${
                recordingState === "transcribing" || recordingState === "recording"
                  ? "bg-gray-700 text-gray-500 border-gray-600 cursor-not-allowed"
                  : "bg-teal-600 hover:bg-teal-500 text-white border-teal-400"
              }`}
            >
              Review
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={isLastQuestion || totalQuestions === 0 || recordingState === "transcribing" || recordingState === "recording"}
              className={`flex-1 text-xl md:text-xl font-bold py-6 rounded-lg transition border-3 ${
                isLastQuestion || totalQuestions === 0 || recordingState === "transcribing" || recordingState === "recording"
                  ? "bg-gray-700 text-gray-500 border-gray-600 cursor-not-allowed"
                  : "bg-teal-600 hover:bg-teal-500 text-white border-teal-400"
              }`}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionNavigatorPage;