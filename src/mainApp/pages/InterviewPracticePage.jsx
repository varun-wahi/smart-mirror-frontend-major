import React, { useEffect, useState, useRef } from "react";

const InterviewPracticePage = () => {
  const [interviewData, setInterviewData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({
    eventsReceived: 0,
    lastEventTime: null,
    initialized: false
  });
  const previousIndexRef = useRef(null);

  // Enhanced speech function with more robust error handling
  const speakQuestion = (text) => {
    if (!text) return;
    
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Simple settings that work across platforms
      utterance.rate = 0.9;
      utterance.volume = 1.0;
      
      // Try to select an English voice if available
      try {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          const englishVoice = voices.find(voice => voice.lang.startsWith("en"));
          if (englishVoice) {
            utterance.voice = englishVoice;
          }
        }
      } catch (voiceError) {
        console.warn("[InterviewPracticePage] Voice selection error:", voiceError);
        // Continue with default voice
      }
      
      window.speechSynthesis.speak(utterance);
      console.log("[InterviewPracticePage] Speaking question:", text.substring(0, 50) + "...");
    } catch (err) {
      console.error("[InterviewPracticePage] Speech synthesis error:", err);
      setError("Speech synthesis failed. Please check browser compatibility.");
    }
  };

  const ensureVoicesLoaded = () => {
    return new Promise((resolve) => {
      try {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          console.log("[InterviewPracticePage] Voices loaded initially:", voices.length);
          resolve();
        } else {
          console.log("[InterviewPracticePage] Waiting for voices to load...");
          const voicesChangedHandler = () => {
            console.log("[InterviewPracticePage] Voices loaded after waiting:", 
              window.speechSynthesis.getVoices().length);
            resolve();
          };
          window.speechSynthesis.onvoiceschanged = voicesChangedHandler;
          
          // Safety timeout in case onvoiceschanged never fires
          setTimeout(() => {
            console.log("[InterviewPracticePage] Voice loading timed out, continuing anyway");
            resolve();
          }, 2000);
        }
      } catch (err) {
        console.error("[InterviewPracticePage] Error loading voices:", err);
        resolve(); // Continue anyway
      }
    });
  };

  // Initialize and set up IPC listeners
  useEffect(() => {
    console.log("[InterviewPracticePage] Component mounted, setting up event listeners");
    let isMounted = true;
    
    // Add explicit check for API availability
    if (!window.api) {
      console.error("[InterviewPracticePage] window.api is not available!");
      setError("IPC API not available. This may be due to incorrect Electron setup.");
      return;
    }
    
    const handleShowInterviewScreen = async (data) => {
      console.log("[InterviewPracticePage] Received interview data:", data);
      if (!isMounted) return;
      
      try {
        setDebugInfo(prev => ({
          ...prev,
          eventsReceived: prev.eventsReceived + 1,
          lastEventTime: new Date().toISOString(),
          lastEventType: "show-interview-screen"
        }));
        
        if (!data || !data.questions || !Array.isArray(data.questions)) {
          console.error("[InterviewPracticePage] Invalid interview data format:", data);
          setError("Received invalid interview data format");
          return;
        }
        
        // Wait for voices to load (with timeout)
        await ensureVoicesLoaded();
        
        setInterviewData(data);
        setCurrentIndex(0);
        previousIndexRef.current = 0;
        setDebugInfo(prev => ({ ...prev, initialized: true }));
        
        console.log("[InterviewPracticePage] Interview setup complete with", 
          data.questions.length, "questions");
      } catch (err) {
        console.error("[InterviewPracticePage] Error handling interview data:", err);
        setError(`Error initializing interview: ${err.message}`);
      }
    };

    const handleQuestionIndex = (payload) => {
      if (!isMounted) return;
      
      console.log("[InterviewPracticePage] Received index payload:", payload);
      setDebugInfo(prev => ({
        ...prev,
        eventsReceived: prev.eventsReceived + 1,
        lastEventTime: new Date().toISOString(),
        lastEventType: "question-index"
      }));
      
      try {
        const index = payload?.index;
        if (typeof index === "number" && interviewData?.questions?.length > 0) {
          const safeIndex = Math.max(0, Math.min(index, interviewData.questions.length - 1));
          setCurrentIndex(safeIndex);
          previousIndexRef.current = safeIndex;
          console.log("[InterviewPracticePage] Updated question index to:", safeIndex);
        }
      } catch (err) {
        console.error("[InterviewPracticePage] Error handling question index:", err);
      }
    };

    const handleSpeakCommand = () => {
      if (!isMounted) return;
      
      console.log("[InterviewPracticePage] Received speak command");
      setDebugInfo(prev => ({
        ...prev,
        eventsReceived: prev.eventsReceived + 1,
        lastEventTime: new Date().toISOString(),
        lastEventType: "speak-question"
      }));
      
      try {
        if (interviewData?.questions?.[currentIndex]) {
          const questionText = interviewData.questions[currentIndex].question;
          speakQuestion(questionText);
        } else {
          console.warn("[InterviewPracticePage] Cannot speak: No question available");
        }
      } catch (err) {
        console.error("[InterviewPracticePage] Error handling speak command:", err);
      }
    };

    // Check cached data from sessionStorage as a fallback
    try {
      const cachedData = sessionStorage.getItem("interviewData");
      if (cachedData && !interviewData) {
        const parsedData = JSON.parse(cachedData);
        console.log("[InterviewPracticePage] Using cached interview data:", parsedData);
        handleShowInterviewScreen(parsedData);
      }
    } catch (e) {
      console.error("[InterviewPracticePage] Failed to parse cached interview data", e);
    }

    // Register event listeners with error handling
    try {
      window.api.on("show-interview-screen", handleShowInterviewScreen);
      window.api.on("question-index", handleQuestionIndex);
      window.api.on("speak-question", handleSpeakCommand);
      console.log("[InterviewPracticePage] IPC event listeners registered successfully");
    } catch (err) {
      console.error("[InterviewPracticePage] Error setting up event listeners:", err);
      setError(`Failed to initialize communication: ${err.message}`);
    }

    // Send ready event to main process to request initial data
    try {
      console.log("[InterviewPracticePage] Sending ready-for-interview event");
      if (window.api.send) {
        window.api.send("ready-for-interview");
      }
    } catch (err) {
      console.error("[InterviewPracticePage] Error sending ready event:", err);
    }

    return () => {
      isMounted = false;
      console.log("[InterviewPracticePage] Component unmounting, cleaning up listeners");
      
      try {
        window.api.removeAllListeners("show-interview-screen");
        window.api.removeAllListeners("question-index");
        window.api.removeAllListeners("speak-question");
        window.speechSynthesis.cancel();
      } catch (err) {
        console.error("[InterviewPracticePage] Error during cleanup:", err);
      }
    };
  }, []);

  // Effect to automatically speak questions when interview data or current index changes
  useEffect(() => {
    if (interviewData?.questions && previousIndexRef.current === currentIndex) {
      try {
        const questionText = interviewData.questions[currentIndex].question;
        console.log("[InterviewPracticePage] Auto-speaking question", currentIndex + 1);
        speakQuestion(questionText);
      } catch (err) {
        console.error("[InterviewPracticePage] Error auto-speaking question:", err);
      }
    }
  }, [interviewData, currentIndex]);

  // Fallback UI when waiting for data
  if (!interviewData) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <p className="text-gray-400 mb-4">Waiting for questions from controller...</p>
        
        {error && (
          <div className="mt-4 p-4 bg-red-900/50 rounded-lg max-w-md text-center">
            <p className="text-red-300 font-medium">Error: {error}</p>
          </div>
        )}
        
        {/* Debug info - helpful for troubleshooting on Raspberry Pi */}
        <div className="mt-8 p-4 bg-gray-800/50 rounded-lg text-left max-w-md">
          <h3 className="text-gray-400 mb-2 font-medium">Debug Information:</h3>
          <p className="text-gray-500 text-sm mb-1">Events received: {debugInfo.eventsReceived}</p>
          <p className="text-gray-500 text-sm mb-1">Last event: {debugInfo.lastEventType || "none"}</p>
          <p className="text-gray-500 text-sm mb-1">Last event time: {debugInfo.lastEventTime || "never"}</p>
          <p className="text-gray-500 text-sm mb-1">API available: {window.api ? "Yes" : "No"}</p>
          <p className="text-gray-500 text-sm">Speaker available: {window.speechSynthesis ? "Yes" : "No"}</p>
          
          {/* Manual data loading button as fallback for RPI5 */}
          <div className="mt-4">
            <button 
              onClick={() => {
                try {
                  const cachedData = sessionStorage.getItem("interviewData");
                  if (cachedData) {
                    const parsedData = JSON.parse(cachedData);
                    setInterviewData(parsedData);
                    setCurrentIndex(0);
                    previousIndexRef.current = 0;
                    console.log("[InterviewPracticePage] Manually loaded interview data");
                  } else {
                    alert("No cached interview data available");
                  }
                } catch (e) {
                  console.error("Failed to load cached data", e);
                  alert("Error loading cached data: " + e.message);
                }
              }}
              className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm">
              Try Manual Load
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main interview UI when data is loaded
  const { topic, questions } = interviewData;
  const question = questions[currentIndex];

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < questions.length - 1;

  const goPrev = () => {
    if (canGoPrev) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goNext = () => {
    if (canGoNext) {
      setCurrentIndex(currentIndex + 1);
    }
  };

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

        {/* Add navigation controls that are normally hidden but helpful for debugging */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={goPrev}
            disabled={!canGoPrev}
            className={`px-4 py-2 rounded ${
              canGoPrev 
                ? "bg-blue-700 hover:bg-blue-600" 
                : "bg-gray-700 cursor-not-allowed"
            }`}
          >
            Previous
          </button>
          
          <button
            onClick={() => speakQuestion(question.question)}
            className="px-4 py-2 rounded bg-green-700 hover:bg-green-600"
          >
            Speak Question
          </button>
          
          <button
            onClick={goNext}
            disabled={!canGoNext}
            className={`px-4 py-2 rounded ${
              canGoNext 
                ? "bg-blue-700 hover:bg-blue-600" 
                : "bg-gray-700 cursor-not-allowed"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewPracticePage;