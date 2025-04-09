import React, { useEffect, useState, useRef } from "react";

const InterviewPracticePage = () => {
  const [interviewData, setInterviewData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const previousIndexRef = useRef(null);

  const speakQuestion = (text) => {
    if (!text) return;
  
    window.speechSynthesis.cancel();
  
    const utterance = new SpeechSynthesisUtterance(text);
  
    // Optional speech settings
    utterance.rate = 1.3;
    utterance.pitch = 1;
    utterance.volume = 1;
  
    const preferredVoices = ["Google UK English Female", "Microsoft David Desktop"];
    const voices = window.speechSynthesis.getVoices();
  
    if (voices.length > 0) {
      // First, try to find a preferred voice
      const preferredVoice = voices.find(voice => preferredVoices.includes(voice.name));
  
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      } else {
        // Otherwise fallback to any English voice
        const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }
    }
  
    window.speechSynthesis.speak(utterance);
  };
  

  const ensureVoicesLoaded = () => {
    return new Promise((resolve) => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve();
      } else {
        window.speechSynthesis.onvoiceschanged = () => resolve();
      }
    });
  };

  useEffect(() => {
    const handleShowInterviewScreen = async (data) => {
      console.log("[InterviewPracticePage] Received interview data:", data);
      setInterviewData(data);
      setCurrentIndex(0);


      if (data?.questions?.length > 0) {
        await ensureVoicesLoaded(); // wait until voices are loaded
        setTimeout(() => {
          speakQuestion(data.questions[0].question);
        }, 300);
      }


    };

    const handleQuestionIndex = async (payload) => {
      const index = payload?.index;
      console.log("[InterviewPracticePage] Received index payload:", payload);
      if (typeof index === "number") {
        await ensureVoicesLoaded();
        setCurrentIndex(index);
        previousIndexRef.current = index;
      }
    };

    window.api.on("show-interview-screen", handleShowInterviewScreen);
    window.api.on("question-index", handleQuestionIndex);

    return () => {
      window.api.removeAllListeners("show-interview-screen");
      window.api.removeAllListeners("question-index");
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (interviewData?.questions && previousIndexRef.current === currentIndex) {
      const questionText = interviewData.questions[currentIndex].question;
      speakQuestion(questionText);
    }
  }, [interviewData, currentIndex]);

  if (!interviewData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Waiting for questions from controller...</p>
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
            {currentIndex + 1}. {question.question}
          </p>
          <p className="text-sm text-gray-400">{question.answer}</p>
        </div>
  
        <button 
          onClick={() => speakQuestion(question.question)}
          className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-md"
        >
          Read Question Again
        </button>
      </div>
    </div>
  );
};

export default InterviewPracticePage;
