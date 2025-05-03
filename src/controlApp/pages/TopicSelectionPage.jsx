import React, { useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const topics = ["React JS", "Python", "SDE", "OOPS", "DBMS", "computer-networks", "operating-systems",];
const difficulties = ["Easy", "Medium", "Hard"];
const questionCounts = [5, 10, 20];

const TopicSelectionPage = () => {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [questionCount, setQuestionCount] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleNext = async () => {
    if (!selectedTopic || !difficulty || !questionCount) {
      alert("Please select topic, difficulty, and number of questions.");
      return;
    }

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

      // 🔥 Send same data to controller's QuestionNavigatorPage
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

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-blue-950 text-blue-50">
      <header className="p-6 border-b border-blue-900/30">
        <button 
          onClick={() => navigate("/")} 
          className="flex items-center text-blue-400 hover:text-blue-300 transition-colors duration-200"
        >
          <ArrowLeft size={18} className="mr-2" />
          <span className="font-medium">Back to Home</span>
        </button>
      </header>

      <div className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full overflow-y-auto">
        {/* Topics */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-blue-200">Choose a Topic</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {topics.map((topic) => (
              <button
                key={topic}
                className={`p-5 rounded-xl font-medium shadow-lg transition-all duration-200 ${
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

        {/* Difficulty */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-5 text-blue-200">Select Difficulty</h3>
          <div className="flex flex-col sm:flex-row gap-4 mb-2">
            {difficulties.map((level) => (
              <button
                key={level}
                className={`px-6 py-3 rounded-lg font-medium flex-1 transition-all duration-200 ${
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

        {/* Question Count */}
        <div className="mb-10">
          <h3 className="text-xl font-bold mb-5 text-blue-200">Number of Questions</h3>
          <div className="flex flex-col sm:flex-row gap-4 mb-2">
            {questionCounts.map((count) => (
              <button
                key={count}
                className={`px-6 py-3 rounded-lg font-medium flex-1 transition-all duration-200 ${
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

        {/* Start Interview */}
        <button
          onClick={handleNext}
          disabled={!selectedTopic || !difficulty || !questionCount || loading}
          className={`w-full py-4 rounded-xl flex items-center justify-center text-lg font-semibold shadow-lg transition-all duration-200 ${
            !selectedTopic || !difficulty || !questionCount || loading
              ? "bg-blue-800/50 text-blue-300/50 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
          }`}
        >
          {loading ? "Loading..." : "Start Interview"}
          <ChevronRight size={20} className="ml-2" />
        </button>
      </div>
    </div>
  );
};

export default TopicSelectionPage;