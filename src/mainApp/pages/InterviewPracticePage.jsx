import React, { useEffect, useState, useRef } from "react";

const InterviewPracticePage = () => {
  const [interviewData, setInterviewData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const previousIndexRef = useRef(null);

  const speakQuestion = (text) => {
    if (!text) return;
  
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
  
    // // More natural settings
    utterance.rate = 0.8;     // Normal speed
    // utterance.pitch = 0.9;    // Slightly expressive
    // utterance.volume = 1.0;   // Full volume
  
    // const preferredVoices = [
    //   "Google UK English Female",
    //   "Google US English",
    //   "Microsoft Aria Online (Natural)",
    //   "Microsoft Jenny Online (Natural)"
    // ];
  
    // const voices = window.speechSynthesis.getVoices();
  
    // if (voices.length > 0) {
    //   const preferredVoice = voices.find((voice) =>
    //     preferredVoices.includes(voice.name)
    //   );
  
    //   if (preferredVoice) {
    //     utterance.voice = preferredVoice;
    //   } else {
    //     const englishVoice = voices.find((voice) => voice.lang.startsWith("en"));
    //     if (englishVoice) {
    //       utterance.voice = englishVoice;
    //     }
    //   }
    // }
  
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
      await ensureVoicesLoaded();
      setInterviewData(data);
      setCurrentIndex(0);
      previousIndexRef.current = 0;
    };

    const handleQuestionIndex = (payload) => {
      const index = payload?.index;
      console.log("[InterviewPracticePage] Received index payload:", payload);
      if (typeof index === "number" && interviewData?.questions?.length > 0) {
        const safeIndex = Math.max(0, Math.min(index, interviewData.questions.length - 1));
        setCurrentIndex(safeIndex);
        previousIndexRef.current = safeIndex;
      }
    };

    const handleSpeakCommand = () => {
      if (interviewData?.questions?.[currentIndex]) {
        const questionText = interviewData.questions[currentIndex].question;
        speakQuestion(questionText);
      }
    };

    window.api.on("show-interview-screen", handleShowInterviewScreen);
    window.api.on("question-index", handleQuestionIndex);
    window.api.on("speak-question", handleSpeakCommand);

    return () => {
      window.api.removeAllListeners("show-interview-screen");
      window.api.removeAllListeners("question-index");
      window.api.removeAllListeners("speak-question");
      window.speechSynthesis.cancel();
    };
  }, [interviewData, currentIndex]);


  //! AUTOMATICALLY SPEAK QUESTION
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

       

        
      </div>
    </div>
  );
};

export default InterviewPracticePage;
