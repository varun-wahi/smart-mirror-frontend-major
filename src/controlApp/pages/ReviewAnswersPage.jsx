import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ReviewAnswersPage = () => {
  const [interviewData, setInterviewData] = useState(null);
  const [transcriptions, setTranscriptions] = useState({});
  const [analysisResults, setAnalysisResults] = useState({});
  const [overallAnalysis, setOverallAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysisIndex, setCurrentAnalysisIndex] = useState(null);
  const [overallScore, setOverallScore] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  
  // States for Telegram integration
  const [showTelegramDialog, setShowTelegramDialog] = useState(false);
  const [telegramGroupId, setTelegramGroupId] = useState('-4786736575');
  const [isSendingToTelegram, setIsSendingToTelegram] = useState(false);
  const [telegramSendResult, setTelegramSendResult] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Load interview data and transcriptions from session storage
    const storedData = sessionStorage.getItem('interviewData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setInterviewData(parsedData);
      
      // Debug logging
      console.log('Stored Interview Data:', parsedData);
    }

    const storedTranscriptions = JSON.parse(sessionStorage.getItem('transcriptions') || '{}');
    console.log('Stored Transcriptions:', storedTranscriptions);
    setTranscriptions(storedTranscriptions);

    // Log number of questions and transcriptions
    if (JSON.parse(storedData)?.questions) {
      console.log('Number of Questions:', JSON.parse(storedData).questions.length);
      console.log('Number of Transcriptions:', Object.keys(storedTranscriptions).length);
    }
    
    // Load stored analysis results if available
    const storedAnalysisResults = JSON.parse(sessionStorage.getItem('analysisResults') || '{}');
    if (Object.keys(storedAnalysisResults).length > 0) {
      setAnalysisResults(storedAnalysisResults);
    }
    
    const storedOverallAnalysis = JSON.parse(sessionStorage.getItem('overallAnalysis') || 'null');
    if (storedOverallAnalysis) {
      setOverallAnalysis(storedOverallAnalysis);
    }
  }, []);

  // Calculate overall score whenever analysis results change
  useEffect(() => {
    if (Object.keys(analysisResults).length > 0) {
      const scores = Object.values(analysisResults).map(result => result.overallScore || 0);
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      setOverallScore(Math.round(avgScore * 10) / 10); // Round to 1 decimal place
    }
  }, [analysisResults]);

  const handleBackToHome = () => {
    navigate("/");
  };

  const analyzeAllAnswers = async () => {
    console.log('Current Interview Data:', interviewData);
    console.log('Current Transcriptions:', transcriptions);

    if (!interviewData?.questions?.length) {
      console.error('No interview questions available');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    const results = { ...analysisResults };

    try {
      for (let i = 0; i < interviewData.questions.length; i++) {
        console.log(`Checking transcription for question ${i}:`, transcriptions[i]);

        if (transcriptions[i]) {
          console.log(`Attempting to analyze question ${i}:`, {
            question: interviewData.questions[i].question,
            transcription: transcriptions[i]
          });

          setCurrentAnalysisIndex(i);
          try {
            const result = await analyzeAnswer(interviewData.questions[i].question, transcriptions[i], i);
            console.log(`Analysis result for question ${i}:`, result);
            results[i] = result;
          } catch (error) {
            console.error(`Error analyzing answer ${i}:`, error);
          }
        } else {
          console.warn(`No transcription for question ${i}`);
        }
      }

      // Log the final results before setting state
      console.log('Final analysis results:', results);

      // Only set results if something was analyzed
      if (Object.keys(results).length > 0) {
        setAnalysisResults(results);
        sessionStorage.setItem('analysisResults', JSON.stringify(results));

        // After analyzing all individual answers, get the overall analysis
        await analyzeFullInterview();
        // After full analysis is done, navigate to analysis screens
        handleShowAnalysis();
      } else {
        console.error('No answers were analyzed');
        setAnalysisError('No transcriptions found to analyze');
      }
    } catch (error) {
      console.error('Error during analysis:', error);
      setAnalysisError('An error occurred during analysis. Please try again.');
    } finally {
      setCurrentAnalysisIndex(null);
      setIsAnalyzing(false);
    }
  };

  const analyzeAnswer = async (question, answer, index) => {
    try {
      // Call your backend API to analyze the answer
      const response = await fetch('http://localhost:5020/api/interview/analyze-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          answer,
          context: interviewData.topic, // Send the interview topic for context
          difficulty: interviewData.difficulty
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze answer');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error analyzing answer:', error);
      throw error;
    }
  };

  const analyzeFullInterview = async () => {
    try {
      // Only proceed if we have questions and answers
      if (!interviewData?.questions || Object.keys(transcriptions).length === 0) {
        return;
      }

      const response = await fetch('http://localhost:5020/api/interview/analyze-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questions: interviewData.questions,
          answers: transcriptions,
          topic: interviewData.topic,
          difficulty: interviewData.difficulty
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze interview');
      }

      const data = await response.json();
      setOverallAnalysis(data);
      sessionStorage.setItem('overallAnalysis', JSON.stringify(data));
    } catch (error) {
      console.error('Error analyzing full interview:', error);
      // Don't throw here, as this is a secondary analysis
    }
  };

  const handleShowAnalysis = () => {
    // Retrieve stored analysis data if current state is empty
    const storedAnalysisResults = JSON.parse(sessionStorage.getItem('analysisResults') || '{}');
    const storedOverallAnalysis = JSON.parse(sessionStorage.getItem('overallAnalysis') || 'null');
    const storedOverallScore = sessionStorage.getItem('overallScore');

    // Calculate overall score if not already set
    const calculatedOverallScore = overallScore !== null 
      ? overallScore 
      : storedOverallScore 
        ? parseFloat(storedOverallScore) 
        : storedOverallAnalysis?.overallScore 
          ? storedOverallAnalysis.overallScore 
          : calculateOverallScore(storedAnalysisResults);

    const analysisData = {
      analysisResults: Object.keys(analysisResults).length > 0 ? analysisResults : storedAnalysisResults,
      overallAnalysis: overallAnalysis || storedOverallAnalysis,
      overallScore: calculatedOverallScore,
      topic: interviewData?.topic || 'Unknown Topic',
      difficulty: interviewData?.difficulty || 'Unknown Difficulty'
    };

    console.log('Full analysis data being sent:', {
      analysisResultsCount: Object.keys(analysisData.analysisResults).length,
      overallAnalysis: analysisData.overallAnalysis,
      overallScore: analysisData.overallScore,
      topic: analysisData.topic,
      difficulty: analysisData.difficulty
    });

    // Check if we have meaningful analysis data
    if (Object.keys(analysisData.analysisResults).length === 0 && !analysisData.overallAnalysis) {
      console.error('Cannot send empty analysis results');
      // Optional: Show a user-friendly error message
      alert('No analysis data available. Please analyze your answers first.');
      return;
    }

    // Ensure overallScore is a number
    if (analysisData.overallScore === null || isNaN(analysisData.overallScore)) {
      analysisData.overallScore = 0;
    }

    // Use 'send-analysis-data' instead of 'show-analysis'
    window.api.send('send-analysis-data', analysisData);
    // navigate('/interview-analysis-controller');
  };

  // Helper function to calculate overall score if not already set
  const calculateOverallScore = (analysisResults) => {
    if (Object.keys(analysisResults).length === 0) return 0;

    const scores = Object.values(analysisResults)
      .map(result => result.overallScore || 0)
      .filter(score => !isNaN(score));

    if (scores.length === 0) return 0;

    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(avgScore * 10) / 10; // Round to 1 decimal place
  };

  const handleAnalyzeSingleAnswer = async (question, answer, index) => {
    setCurrentAnalysisIndex(index);
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await analyzeAnswer(question, answer, index);
      const updatedResults = { ...analysisResults, [index]: result };
      setAnalysisResults(updatedResults);
      sessionStorage.setItem('analysisResults', JSON.stringify(updatedResults));
    } catch (error) {
      console.error(`Error analyzing answer ${index}:`, error);
      setAnalysisError(`Failed to analyze answer ${index + 1}. Please try again.`);
    }

    setCurrentAnalysisIndex(null);
    setIsAnalyzing(false);
  };

  // Updated downloadResults function to handle local download and Telegram sending
  const downloadResults = () => {
    // Create a full report with all data - proper format for PDF generation
    const report = {
      interviewTopic: interviewData?.topic || 'Unknown Topic',
      difficulty: interviewData?.difficulty || 'Unknown Difficulty',
      overallScore: overallScore || 0,
      strengthAreas: overallAnalysis?.strengthAreas || [],
      improvementAreas: overallAnalysis?.improvementAreas || [],
      keyInsights: overallAnalysis?.keyInsights || '',
      developmentPlan: overallAnalysis?.developmentPlan || '',
      questions: interviewData?.questions || [],
      answers: Object.values(transcriptions),
      questionAnalysis: analysisResults
    };

    // Perform local download
    // const jsonString = JSON.stringify(report, null, 2);
    // const blob = new Blob([jsonString], { type: 'application/json' });
    // const url = URL.createObjectURL(blob);
    // const link = document.createElement('a');
    // link.href = url;
    // link.download = `interview-results-${new Date().toISOString().slice(0, 10)}.json`;
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
    // URL.revokeObjectURL(url);
    
    // Show Telegram dialog
    // setShowTelegramDialog(true);
    handleSendToTelegram();
  };
  
  // Handle sending report to Telegram
  const handleSendToTelegram = async () => {
    if (!telegramGroupId.trim()) {
      alert('Please enter a valid Telegram Group ID');
      return;
    }

    setIsSendingToTelegram(true);
    setTelegramSendResult(null);
    
    try {
      const report = {
        interviewTopic: interviewData?.topic || 'Unknown Topic',
        difficulty: interviewData?.difficulty || 'Unknown Difficulty',
        overallScore: overallScore || 0,
        strengthAreas: overallAnalysis?.strengthAreas || [],
        improvementAreas: overallAnalysis?.improvementAreas || [],
        keyInsights: overallAnalysis?.keyInsights || '',
        developmentPlan: overallAnalysis?.developmentPlan || '',
        questions: interviewData?.questions || [],
        answers: Object.values(transcriptions),
        questionAnalysis: analysisResults
      };
      
      const response = await fetch('http://localhost:5020/api/interview/send-telegram-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report,
          telegramGroupId
        }),
      });

      const data = await response.json();
      setTelegramSendResult(data);
      
      if (data.success) {
        setTimeout(() => {
          setShowTelegramDialog(false);
          setTelegramSendResult(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Error sending to Telegram:', error);
      setTelegramSendResult({ 
        success: false, 
        error: error.message 
      });
    } finally {
      setIsSendingToTelegram(false);
    }
  };

  // Helper to render score bars with appropriate colors
  const renderScoreBar = (score, label) => {
    let colorClass = 'bg-red-500';
    if (score >= 8) colorClass = 'bg-green-500';
    else if (score >= 6) colorClass = 'bg-blue-500';
    else if (score >= 4) colorClass = 'bg-yellow-500';
    else if (score >= 2) colorClass = 'bg-orange-500';

    return (
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm">{label}</span>
          <span className="text-sm font-medium">{score}/10</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`${colorClass} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${score * 10}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <div className="p-4 md:p-6 border-b border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
        <button
          onClick={handleBackToHome}
          className="text-gray-300 hover:text-white bg-gray-800 px-4 py-2 rounded-lg font-medium flex items-center"
        >
          ← Back to Home
        </button>
        <h1 className="text-lg md:text-xl font-semibold text-center">Review Answers</h1>

        <div className="flex gap-2">
          <button
            onClick={analyzeAllAnswers}
            disabled={isAnalyzing}
            className={`px-4 py-2 rounded-lg font-medium ${isAnalyzing ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
              }`}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze All Answers'}
          </button>

          {Object.keys(analysisResults).length > 0 && (
            <button
              onClick={downloadResults}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium"
            >
              Download Results
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-6">
        {analysisError && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
            {analysisError}
          </div>
        )}

        {overallScore !== null && (
          <div className="mb-8 bg-gray-800 p-6 rounded-lg">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
              <h2 className="text-xl font-bold mb-2 md:mb-0">Overall Performance</h2>
              <div className="text-3xl font-bold">
                {overallScore}/10
                <span className="ml-2 text-lg">
                  {overallScore >= 9 ? '(Excellent)' :
                    overallScore >= 7 ? '(Good)' :
                      overallScore >= 5 ? '(Average)' :
                        overallScore >= 3 ? '(Needs Improvement)' : '(Poor)'}
                </span>
              </div>
            </div>

            <div className="w-full bg-gray-700 rounded-full h-3 mb-6">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${overallScore >= 8 ? 'bg-green-500' :
                  overallScore >= 6 ? 'bg-blue-500' :
                    overallScore >= 4 ? 'bg-yellow-500' :
                      overallScore >= 2 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                style={{ width: `${overallScore * 10}%` }}
              ></div>
            </div>

            <div className="text-gray-300 mb-4">
              {Object.keys(analysisResults).length} of {interviewData?.questions?.length || 0} answers analyzed
            </div>
          </div>
        )}

        <div className="mb-8 text-base md:text-lg bg-gray-800 px-6 py-3 rounded-full flex justify-between items-center">
          <span>Review your answers below:</span>
          <span className="text-sm text-gray-300">Topic: {interviewData?.topic} • Difficulty: {interviewData?.difficulty}</span>
        </div>

        {interviewData?.questions?.map((qObj, index) => (
          <div key={index} className="mb-8 bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <div className="flex justify-between">
                <strong className="text-gray-300">Question {index + 1}:</strong>
                <span className="text-sm text-gray-400">
                  {analysisResults[index] ? `Score: ${analysisResults[index].overallScore}/10` : ''}
                </span>
              </div>
              <div className="text-lg mt-1">{qObj.question}</div>
            </div>

            <div className="p-4 bg-gray-800">
              <strong className="text-gray-300">Your Answer:</strong>
              <div className="mt-1 text-white">
                {transcriptions[index] || "No transcription available"}
              </div>
            </div>

            <div className="p-4 bg-gray-700 border-t border-gray-600">
              <strong className="text-gray-300">Model Answer:</strong>
              <div className="mt-1 text-gray-200">
                {qObj.answer}
              </div>
            </div>

            {analysisResults[index] ? (
              <div className="p-4 bg-gray-700 border-t border-gray-600">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Analysis</h3>
                  <div className="text-xl font-bold">
                    {analysisResults[index].overallScore}/10
                  </div>
                </div>

                {renderScoreBar(analysisResults[index].relevanceScore, 'Relevance')}
                {renderScoreBar(analysisResults[index].completenessScore, 'Completeness')}
                {renderScoreBar(analysisResults[index].clarityScore, 'Clarity')}
                {renderScoreBar(analysisResults[index].accuracyScore, 'Accuracy')}

                <div className="mt-4">
                  <h4 className="font-medium mb-2 text-gray-300">Feedback</h4>
                  <p>{analysisResults[index].feedback}</p>
                </div>

                {analysisResults[index].improvementSuggestions && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2 text-gray-300">Improvement Suggestions</h4>
                    <p>{analysisResults[index].improvementSuggestions}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-gray-700 border-t border-gray-600 flex items-center justify-between">
                <span>{!transcriptions[index] ? "Record an answer first" : "Not yet analyzed"}</span>
                <button
                  onClick={() => handleAnalyzeSingleAnswer(qObj.question, transcriptions[index], index)}
                  disabled={isAnalyzing || !transcriptions[index]}
                  className={`px-3 py-1 rounded text-sm ${isAnalyzing || !transcriptions[index] ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
                    }`}
                >
                  {currentAnalysisIndex === index ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Telegram Dialog */}
      {showTelegramDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Send to Telegram</h3>
            <p className="mb-4 text-gray-300">
              Enter your Telegram Group ID to send this report as a PDF:
            </p>
            <input
              type="text"
              value={telegramGroupId}
              onChange={(e) => setTelegramGroupId(e.target.value)}
              placeholder="Telegram Group ID"
              className="w-full p-2 mb-4 bg-gray-700 border border-gray-600 rounded text-white"
            />
            
            {telegramSendResult && (
              <div 
                className={`p-3 mb-4 rounded ${
                  telegramSendResult.success 
                    ? 'bg-green-900/30 border border-green-700 text-green-200' 
                    : 'bg-red-900/30 border border-red-700 text-red-200'
                }`}
              >
                {telegramSendResult.success 
                  ? 'Report sent successfully!' 
                  : `Error: ${telegramSendResult.error || 'Failed to send report'}`}
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowTelegramDialog(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
              >
                Close
              </button>
              <button
                onClick={handleSendToTelegram}
                disabled={isSendingToTelegram}
                className={`px-4 py-2 rounded ${
                  isSendingToTelegram 
                    ? 'bg-blue-800 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {isSendingToTelegram ? 'Sending...' : 'Send to Telegram'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewAnswersPage;