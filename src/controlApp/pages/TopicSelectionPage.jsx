import React, { useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const topics = ["React JS", "Python", "SDE", "OOPS", "DBMS", "Computer Networks", "Operating Systems"];
const difficulties = ["Easy", "Medium", "Hard"];
const questionCounts = [5, 10, 20];

const TopicSelectionPage = () => {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [questionCount, setQuestionCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Topic, Step 2: Difficulty, Step 3: Question Count

  const navigate = useNavigate();

  const handleNext = async () => {
    if (step === 1 && selectedTopic) {
      setStep(2);
      return;
    }

    if (step === 2 && difficulty) {
      setStep(3);
      return;
    }

    if (step === 3 && questionCount) {
      // Final step - start the interview
      startInterview();
      return;
    }

    alert("Please make a selection before continuing.");
  };

  const handleBack = () => {
    if (step === 1) {
      navigate("/");
    } else if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };

  const startInterview = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5020/api/interview/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: selectedTopic,
          difficulty: difficulty.toLowerCase(),
          numQuestions: questionCount,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch questions");

      const data = await response.json();

      // Send data to display app
      window.api.send("show-interview-screen", {
        topic: selectedTopic,
        difficulty,
        questions: data.questions,
      });

      // Send same data to controller's QuestionNavigatorPage
      window.api.send("interview-data", {
        topic: selectedTopic,
        difficulty,
        questions: data.questions,
      });

      // Navigate to Question Navigator page (controller side)
      navigate("/question-navigator");
    } catch (error) {
      console.error("Error fetching or sending data:", error.message);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col h-full">
            <h2 className="text-2xl font-bold mb-6 text-blue-200">Choose a Topic</h2>
            <div className="grid grid-cols-2 gap-4 flex-1">
              {topics.map((topic) => (
                <button
                  key={topic}
                  className={`p-4 rounded-xl text-lg font-medium shadow-lg transition-all duration-200 flex items-center justify-center ${
                    selectedTopic === topic 
                      ? "bg-blue-700 text-white shadow-blue-700/20" 
                      : "bg-blue-950/80 hover:bg-blue-900 text-blue-200"
                  }`}
                  onClick={() => setSelectedTopic(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col h-full">
            <h3 className="text-2xl font-bold mb-6 text-blue-200">Select Difficulty</h3>
            <div className="grid grid-cols-1 gap-6 flex-1">
              {difficulties.map((level) => (
                <button
                  key={level}
                  className={`p-8 rounded-xl text-xl font-medium shadow-lg transition-all duration-200 ${
                    difficulty === level
                      ? level === "Easy" 
                        ? "bg-green-600 text-white" 
                        : level === "Medium"
                          ? "bg-yellow-600 text-white"
                          : "bg-red-600 text-white"
                      : "bg-blue-950/70 hover:bg-blue-900/70 text-blue-200"
                  }`}
                  onClick={() => setDifficulty(level)}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col h-full">
            <h3 className="text-2xl font-bold mb-6 text-blue-200">Number of Questions</h3>
            <div className="grid grid-cols-1 gap-6 flex-1">
              {questionCounts.map((count) => (
                <button
                  key={count}
                  className={`p-8 rounded-xl text-xl font-medium shadow-lg transition-all duration-200 ${
                    questionCount === count
                      ? "bg-blue-600 text-white shadow-blue-600/20" 
                      : "bg-blue-950/70 hover:bg-blue-900/70 text-blue-200"
                  }`}
                  onClick={() => setQuestionCount(count)}
                >
                  {count} Questions
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getStepButtonText = () => {
    if (step === 1) return "Next: Select Difficulty";
    if (step === 2) return "Next: Select Questions";
    if (step === 3) return loading ? "Loading..." : "Start Interview";
    return "Next";
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-blue-950 text-blue-50">
      <header className="p-4 border-b border-blue-900/30 flex items-center">
        <button 
          onClick={handleBack}
          className="flex items-center text-blue-400 hover:text-blue-300 transition-colors duration-200"
        >
          <ArrowLeft size={18} className="mr-2" />
          <span className="font-medium">
            {step === 1 ? "Back to Home" : step === 2 ? "Back to Topic" : "Back to Difficulty"}
          </span>
        </button>
        <div className="ml-auto flex space-x-2">
          <div className={`h-2 w-8 rounded-full ${step >= 1 ? "bg-blue-500" : "bg-blue-900"}`}></div>
          <div className={`h-2 w-8 rounded-full ${step >= 2 ? "bg-blue-500" : "bg-blue-900"}`}></div>
          <div className={`h-2 w-8 rounded-full ${step >= 3 ? "bg-blue-500" : "bg-blue-900"}`}></div>
        </div>
      </header>

      <div className="flex-1 p-4 flex flex-col">
        <div className="flex-1 flex flex-col">
          {renderStepContent()}
        </div>

        <button
          onClick={handleNext}
          disabled={(step === 1 && !selectedTopic) || 
                   (step === 2 && !difficulty) || 
                   (step === 3 && !questionCount) || 
                   loading}
          className={`mt-4 w-full py-4 rounded-xl flex items-center justify-center text-lg font-semibold shadow-lg transition-all duration-200 ${
            (step === 1 && !selectedTopic) || 
            (step === 2 && !difficulty) || 
            (step === 3 && !questionCount) || 
            loading
              ? "bg-blue-800/50 text-blue-300/50 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
          }`}
        >
          {getStepButtonText()}
          <ChevronRight size={20} className="ml-2" />
        </button>
      </div>
    </div>
  );
};

export default TopicSelectionPage;