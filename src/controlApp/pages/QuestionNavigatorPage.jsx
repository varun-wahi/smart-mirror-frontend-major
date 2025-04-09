import React, { useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Volume2 , Mic} from "lucide-react";
import { useNavigate } from "react-router-dom";

const QuestionNavigatorPage = () => {
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    window.api.receive("interview-data", (data) => {
      const questions = data.questions || [];
      setTotalQuestions(questions.length);
      setCurrentIndex(0);
      sendQuestionIndex(0);
    });

    return () => {
      window.api.removeAllListeners("interview-data");
    };
  }, []);

  const sendQuestionIndex = (index) => {
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
    if (currentIndex < totalQuestions - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      sendQuestionIndex(newIndex);
    }
  };

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
        <div></div>
      </div>

      {/* Control Buttons */}
      <div className="flex-1 flex flex-col justify-center items-center p-6">
        <div className="text-gray-400 text-lg mb-8">
          Question {currentIndex + 1} of {totalQuestions}
        </div>

        {/* Prev / Next Buttons */}
        <div className="flex gap-6 w-full h-[60vh]">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`flex items-center justify-center w-1/2 rounded-2xl text-4xl font-bold transition ${
              currentIndex === 0
                ? "bg-gray-700/50 text-gray-400 cursor-not-allowed"
                : "bg-blue-700 hover:bg-blue-600"
            }`}
          >
            <ChevronLeft size={48} className="mr-6" />
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex >= totalQuestions - 1}
            className={`flex items-center justify-center w-1/2 rounded-2xl text-4xl font-bold transition ${
              currentIndex >= totalQuestions - 1
                ? "bg-gray-700/50 text-gray-400 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-500"
            }`}
          >
            Next
            <ChevronRight size={48} className="ml-6" />
          </button>
        </div>

        {/* Speaker and Mic Buttons */}
        <div className="flex gap-8 mt-10">
          <button className="flex items-center justify-center p-4 rounded-full bg-gray-800 hover:bg-gray-700 transition">
            <Volume2 size={28} className="text-white" />
          </button>

          <button className="flex items-center justify-center p-4 rounded-full bg-gray-800 hover:bg-gray-700 transition">
            <Mic size={28} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionNavigatorPage;
