import React, { useState, useEffect } from 'react';

const AnalysisController = () => {
  const [currentTab, setCurrentTab] = useState('radar');
  const [hasQuestionDetails, setHasQuestionDetails] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState([]);

  // Tabs configuration
  const tabs = [
    { id: 'radar', label: 'Skill Radar', icon: '📊' },
    { id: 'bar', label: 'Question Scores', icon: '📈' },
    { id: 'line', label: 'Score Trends', icon: '📉' },
    { id: 'strengths', label: 'Strengths', icon: '⭐' }
  ];

  // Effect to listen for analysis data
  useEffect(() => {
    // Listener for analysis data to extract available questions
    const handleAnalysisData = (data) => {
      if (data.analysisResults) {
        const questions = Object.keys(data.analysisResults).map(key => parseInt(key));
        setAvailableQuestions(questions);
      }
    };

    window.api.on('analysis-data', handleAnalysisData);

    return () => {
      window.api.removeListener('analysis-data', handleAnalysisData);
    };
  }, []);

  // Handle tab change
  const handleTabChange = (tabId) => {
    setCurrentTab(tabId);
    window.api.send('request-tab-change', tabId);
  };

  // Handle scroll
  const handleScroll = (direction) => {
    window.api.send('request-scroll', direction);
  };

  // Handle question details
  const handleQuestionDetails = (questionIndex) => {
    if (availableQuestions.includes(questionIndex)) {
      window.api.send('request-question-details', questionIndex);
      setHasQuestionDetails(true);
    }
  };

  // Close question details
  const handleCloseQuestionDetails = () => {
    window.api.send('request-close-question-details');
    setHasQuestionDetails(false);
  };

  // Close analysis and return to previous screen
  const handleCloseAnalysis = () => {
    window.api.send('navigate', { path: '/interview-practice' });
  };

  return (
    <div className="bg-gray-900 h-screen flex flex-col p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Interview Analysis</h2>
        <button 
          onClick={handleCloseAnalysis}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Close
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex justify-between mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center justify-center w-full mx-1 p-2 rounded ${
              currentTab === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrolling Controls */}
      <div className="flex justify-between mb-4">
        <button 
          onClick={() => handleScroll('up')}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded w-full mr-2"
        >
          ↑ Scroll Up
        </button>
        <button 
          onClick={() => handleScroll('down')}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded w-full"
        >
          ↓ Scroll Down
        </button>
      </div>

      {/* Question Details Controls */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {availableQuestions.map((q) => (
          <button
            key={q}
            onClick={() => handleQuestionDetails(q)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
          >
            Q{q + 1}
          </button>
        ))}
      </div>

      {/* Question Details Modal Control */}
      {hasQuestionDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-4">Question Details</h3>
            <button 
              onClick={handleCloseQuestionDetails}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded w-full"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisController;
