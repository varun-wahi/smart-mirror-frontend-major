import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const QuestionNavigatorPage = () => {
  const [interviewData, setInterviewData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recordingState, setRecordingState] = useState("idle");
  const [transcriptions, setTranscriptions] = useState({});
  const [transcription, setTranscription] = useState("");

  const currentIndexRef = useRef(currentIndex);
  const transcriptionsRef = useRef(transcriptions);

  const navigate = useNavigate();
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    transcriptionsRef.current = transcriptions;
  }, [transcriptions]);

  useEffect(() => {
    audioRef.current = new Audio("sounds/mic_on.mp3");

    const handleInterviewData = (data) => {
      console.log("[QuestionNavigatorPage] Received interview data:", data);
      if (data && data.questions && Array.isArray(data.questions)) {
        setInterviewData(data);
        setCurrentIndex(0);
        setTranscription(transcriptionsRef.current[0] || "");
        setTimeout(() => sendQuestionIndex(0), 100);
      } else {
        console.error("[QuestionNavigatorPage] Invalid interview data format:", data);
      }
    };

    window.api.on("interview-data", handleInterviewData);

    window.api.on("transcription-complete", (result) => {
      console.log("[QuestionNavigatorPage] Transcription result:", result);
      const idx = result.questionIndex;
      const updated = { ...transcriptionsRef.current, [idx]: result.text };
      setTranscriptions(updated);
      if (idx === currentIndexRef.current) {
        setTranscription(result.text);
      }
      // Save transcriptions to sessionStorage
      sessionStorage.setItem('transcriptions', JSON.stringify(updated));
      playTranscribedAudio(result.text);
      setRecordingState("idle");
    });

    const cachedData = sessionStorage.getItem("interviewData");
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
      window.api.removeAllListeners("transcription-complete");
      stopRecording();
      setTranscriptions({});
      setTranscription("");
    };
  }, []);

  useEffect(() => {
    if (interviewData) {
      sessionStorage.setItem("interviewData", JSON.stringify(interviewData));
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
    }
    else if (currentIndex >= interviewData.questions.length - 1) {
      // When the last question is done, navigate to review answers page
      navigate('/review-answers');
    }
  };

  const handleSpeakQuestion = () => {
    window.api.send("speak-question");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start();
      setRecordingState("recording");
      setTranscription("");

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => console.error("Mic sound error:", err));
      }

      console.log("[QuestionNavigatorPage] Recording started");
    } catch (error) {
      console.error("[QuestionNavigatorPage] Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        saveRecording(audioBlob);
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        audioChunksRef.current = [];
      };

      console.log("[QuestionNavigatorPage] Recording stopped");
    }
  };

  const saveRecording = async (audioBlob) => {
    setRecordingState("transcribing");

    try {
      const reader = new FileReader();
      reader.readAsArrayBuffer(audioBlob);

      reader.onloadend = () => {
        const arrayBuffer = reader.result;
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

  const playTranscribedAudio = (text) => {
    console.log("[QuestionNavigatorPage] Transcribed text:", text);

    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.play();

      audio.onended = () => {
        const utterance = new SpeechSynthesisUtterance("Answer transcribed");
        speechSynthesis.speak(utterance);
      };
    } else {
      const utterance = new SpeechSynthesisUtterance("Answer transcribed");
      speechSynthesis.speak(utterance);
    }
  };

  const handleToggleRecording = () => {
    if (recordingState === "idle") {
      startRecording();
    } else if (recordingState === "recording") {
      stopRecording();
    }
  };

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
    disabled={currentIndex === 0 || totalQuestions === 0 || recordingState === "transcribing"}
    className={`flex-1 text-xl md:text-xl font-bold py-6 rounded-lg transition border-3 ${
      currentIndex === 0 || totalQuestions === 0 || recordingState === "transcribing"
        ? "bg-gray-700 text-gray-500 border-gray-600 cursor-not-allowed"
        : "bg-blue-600 hover:bg-blue-500 text-white border-blue-400"
    }`}
  >
    Previous
  </button>

  {currentIndex >= totalQuestions - 1 ? (
    // If the user is on the last question, show the "Review" button
    <button
      onClick={() => navigate('/review-answers')} // Navigate to the Review Answers screen
      className="flex-1 text-xl md:text-xl font-bold py-6 rounded-lg transition bg-teal-600 hover:bg-teal-500 text-white border-teal-400"
    >
      Review
    </button>
  ) : (
    // Otherwise, show the "Next" button
    <button
      onClick={handleNext}
      disabled={currentIndex >= totalQuestions - 1 || totalQuestions === 0 || recordingState === "transcribing"}
      className={`flex-1 text-xl md:text-xl font-bold py-6 rounded-lg transition border-3 ${
        currentIndex >= totalQuestions - 1 || totalQuestions === 0 || recordingState === "transcribing"
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
