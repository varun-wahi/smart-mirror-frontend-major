import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  LineChart, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Line,
} from 'recharts';

const InterviewPerformancePage = ({ analysisResults = {}, overallAnalysis = null, overallScore = null }) => {
  // State for analysis data and UI
  const [localAnalysisResults, setLocalAnalysisResults] = useState(analysisResults);
  const [localOverallAnalysis, setLocalOverallAnalysis] = useState(overallAnalysis);
  const [localOverallScore, setLocalOverallScore] = useState(overallScore);
  const [activeTab, setActiveTab] = useState('radar');
  const [questionDetails, setQuestionDetails] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [radarData, setRadarData] = useState([]);
  
  // Ref for content container
  const contentContainerRef = useRef(null);

  // Improved colors for charts - more vibrant and distinct
  const COLORS = {
    relevance: '#38bdf8',    // Sky blue
    completeness: '#a855f7', // Purple
    clarity: '#22c55e',      // Green
    accuracy: '#fb923c',     // Orange
    overall: '#f43f5e',      // Red
    strength: '#10b981',     // Emerald
    improvement: '#ef4444'   // Red
  };

  // Auto-rotate chart types
  useEffect(() => {
    const chartTypes = ['radar', 'bar', 'line'];
    const rotationInterval = setInterval(() => {
      setActiveTab(prevTab => {
        const currentIndex = chartTypes.indexOf(prevTab);
        const nextIndex = (currentIndex + 1) % chartTypes.length;
        return chartTypes[nextIndex];
      });
    }, 5000); // 10 seconds

    return () => clearInterval(rotationInterval);
  }, []);

  // Handle direct props or IPC data
  useEffect(() => {
    // Update from props if they change
    if (Object.keys(analysisResults).length > 0) {
      setLocalAnalysisResults(analysisResults);
    }
    if (overallAnalysis) {
      setLocalOverallAnalysis(overallAnalysis);
    }
    if (overallScore !== null) {
      setLocalOverallScore(overallScore);
    }

    // Handle IPC data
    const handleAnalysisData = (data) => {
      console.log("Received analysis data via IPC:", data);
      if (data.analysisResults) {
        setLocalAnalysisResults(data.analysisResults);
      }
      if (data.overallAnalysis) {
        setLocalOverallAnalysis(data.overallAnalysis);
      }
      if (data.overallScore !== null && data.overallScore !== undefined) {
        setLocalOverallScore(data.overallScore);
      }
    };

    // Register IPC listeners
    if (window.api) {
      window.api.on('analysis-data', handleAnalysisData);
      window.api.on('show-analysis', handleAnalysisData);
      
      // Debug message to confirm listener registration
      console.log("IPC listeners registered for analysis data");
      
      // Notify the main process that we're ready to receive data
      window.api.send('analysis-component-ready');
    }

    return () => {
      if (window.api) {
        window.api.removeListener('analysis-data', handleAnalysisData);
        window.api.removeListener('show-analysis', handleAnalysisData);
      }
    };
  }, [analysisResults, overallAnalysis, overallScore]);

  // Register additional IPC listeners for UI controls
  useEffect(() => {
    const handleTabChange = (tabName) => {
      setActiveTab(tabName);
    };

    const handleQuestionDetailsRequest = (questionIndex) => {
      if (localAnalysisResults[questionIndex]) {
        setQuestionDetails({
          index: questionIndex,
          ...localAnalysisResults[questionIndex]
        });
      }
    };

    const handleCloseQuestionDetails = () => {
      setQuestionDetails(null);
    };

    if (window.api) {
      window.api.on('change-tab', handleTabChange);
      window.api.on('show-question-details', handleQuestionDetailsRequest);
      window.api.on('close-question-details', handleCloseQuestionDetails);
    }

    return () => {
      if (window.api) {
        window.api.removeListener('change-tab', handleTabChange);
        window.api.removeListener('show-question-details', handleQuestionDetailsRequest);
        window.api.removeListener('close-question-details', handleCloseQuestionDetails);
      }
    };
  }, [localAnalysisResults]);

  // Prepare chart data when analysis results change
  useEffect(() => {
    if (Object.keys(localAnalysisResults).length > 0) {
      prepareChartData();
    }
  }, [localAnalysisResults]);

  // Prepare chart data
  const prepareChartData = () => {
    console.log("Preparing chart data with:", localAnalysisResults);
    const questions = Object.keys(localAnalysisResults).map(index => parseInt(index));
    
    // Prepare data for line/bar charts
    const lineData = questions.map(index => ({
      name: `Q${parseInt(index) + 1}`,
      relevance: localAnalysisResults[index].relevanceScore,
      completeness: localAnalysisResults[index].completenessScore,
      clarity: localAnalysisResults[index].clarityScore,
      accuracy: localAnalysisResults[index].accuracyScore,
      overall: localAnalysisResults[index].overallScore,
      questionIndex: index
    }));
    setChartData(lineData);
    
    // Prepare data for radar chart
    const avgScores = {
      relevance: 0,
      completeness: 0,
      clarity: 0,
      accuracy: 0
    };
    
    questions.forEach(index => {
      avgScores.relevance += localAnalysisResults[index].relevanceScore;
      avgScores.completeness += localAnalysisResults[index].completenessScore;
      avgScores.clarity += localAnalysisResults[index].clarityScore;
      avgScores.accuracy += localAnalysisResults[index].accuracyScore;
    });
    
    const count = questions.length;
    const radar = [
      { subject: 'Relevance', score: avgScores.relevance / count, fullMark: 10 },
      { subject: 'Completeness', score: avgScores.completeness / count, fullMark: 10 },
      { subject: 'Clarity', score: avgScores.clarity / count, fullMark: 10 },
      { subject: 'Accuracy', score: avgScores.accuracy / count, fullMark: 10 }
    ];
    
    setRadarData(radar);
  };

  // Chart type selector tabs
  const renderChartTypeTabs = () => (
    <div className="flex space-x-2 mb-6">
      {['radar', 'bar', 'line'].map((tab) => (
        <button
          key={tab}
          onClick={() => {
            setActiveTab(tab);
            if (window.api) window.api.send('change-tab', tab);
          }}
          className={`px-4 py-2 rounded-md transition-all duration-200 ${
            activeTab === tab
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
          }`}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  );

  // Render question details modal
  const renderQuestionDetails = () => {
    if (!questionDetails) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-black rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto shadow-xl border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Question {parseInt(questionDetails.index) + 1} Analysis</h3>
            <button 
              onClick={() => {
                setQuestionDetails(null);
                if (window.api) window.api.send('close-question-details');
              }}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { name: 'Relevance', color: COLORS.relevance },
              { name: 'Completeness', color: COLORS.completeness },
              { name: 'Clarity', color: COLORS.clarity },
              { name: 'Accuracy', color: COLORS.accuracy }
            ].map(metric => (
              <div 
                key={metric.name} 
                className="bg-gray-900 p-4 rounded-lg shadow-md transition-transform duration-200 hover:scale-105 cursor-default"
                style={{ borderLeft: `4px solid ${metric.color}` }}
              >
                <span className="text-sm text-gray-300">{metric.name}</span>
                <div className="text-2xl font-bold">
                  {questionDetails[`${metric.name.toLowerCase()}Score`]}/10
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-gray-900 p-5 rounded-lg mb-6 shadow-md border-l-4 border-blue-500">
            <h4 className="font-medium mb-3 text-blue-300">Feedback</h4>
            <p className="text-gray-300">{questionDetails.feedback}</p>
          </div>
          
          {questionDetails.improvementSuggestions && (
            <div className="bg-gray-900 p-5 rounded-lg shadow-md border-l-4 border-amber-500">
              <h4 className="font-medium mb-3 text-amber-300">Improvement Suggestions</h4>
              <p className="text-gray-300">{questionDetails.improvementSuggestions}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // If no analysis data, show placeholder
  if (Object.keys(localAnalysisResults).length === 0) {
    return (
      <div className="p-8 bg-black rounded-xl text-center flex flex-col items-center justify-center space-y-4 shadow-lg h-full w-full">
        <div className="bg-gray-900 p-4 rounded-full inline-block">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-white">No Analysis Data Available</h3>
        <p className="text-gray-400 max-w-md">Analyze your interview answers to see detailed performance metrics and improvement suggestions.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-black">
      {/* Main Content Area */}
      <div className="flex-grow overflow-auto">
        <div 
          ref={contentContainerRef} 
          className="h-full p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Performance Analysis</h2>
            {renderChartTypeTabs()}
          </div>
          
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg mb-8">
            <div className="h-80">
              {activeTab === 'radar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#1f2937" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#e5e7eb' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#9ca3af' }} />
                    <Radar
                      name="Skills"
                      dataKey="score"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.6}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)' }}
                      formatter={(value) => [`${value.toFixed(1)}/10`, 'Score']}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              )}
              
              {activeTab === 'bar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="name" tick={{ fill: '#e5e7eb' }} />
                    <YAxis domain={[0, 10]} tick={{ fill: '#9ca3af' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)' }}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="relevance" name="Relevance" fill={COLORS.relevance} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completeness" name="Completeness" fill={COLORS.completeness} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="clarity" name="Clarity" fill={COLORS.clarity} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="accuracy" name="Accuracy" fill={COLORS.accuracy} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="overall" name="Overall" fill={COLORS.overall} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              
              {activeTab === 'line' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="name" tick={{ fill: '#e5e7eb' }} />
                    <YAxis domain={[0, 10]} tick={{ fill: '#9ca3af' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)' }}
                      formatter={(value) => [`${value}/10`, '']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="relevance" name="Relevance" stroke={COLORS.relevance} strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="completeness" name="Completeness" stroke={COLORS.completeness} strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="clarity" name="Clarity" stroke={COLORS.clarity} strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="accuracy" name="Accuracy" stroke={COLORS.accuracy} strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="overall" name="Overall" stroke={COLORS.overall} strokeWidth={3} dot={{ r: 5, strokeWidth: 2 }} activeDot={{ r: 7, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-indigo-900 bg-opacity-40 p-5 rounded-xl shadow-lg flex flex-col items-center justify-center transition-transform duration-200 hover:scale-105 border border-indigo-800">
              <div className="text-sm text-indigo-300 mb-1">Overall Score</div>
              <div className="text-3xl font-bold text-white">{localOverallScore || 
                (Object.keys(localAnalysisResults).length > 0 
                  ? (Object.values(localAnalysisResults).reduce((sum, r) => sum + r.overallScore, 0) / Object.keys(localAnalysisResults).length).toFixed(1)
                  : 'N/A')
              }</div>
            </div>
            
            <div className="bg-green-900 bg-opacity-40 p-5 rounded-xl shadow-lg flex flex-col items-center justify-center transition-transform duration-200 hover:scale-105 border border-green-800">
              <div className="text-sm text-green-300 mb-1">Strongest Area</div>
              <div className="text-xl font-bold text-white">
                {radarData.length > 0 
                  ? radarData.reduce((prev, current) => (prev.score > current.score) ? prev : current).subject
                  : 'N/A'}
              </div>
            </div>
            
            <div className="bg-amber-900 bg-opacity-40 p-5 rounded-xl shadow-lg flex flex-col items-center justify-center transition-transform duration-200 hover:scale-105 border border-amber-800">
              <div className="text-sm text-amber-300 mb-1">Needs Improvement</div>
              <div className="text-xl font-bold text-white">
                {radarData.length > 0 
                  ? radarData.reduce((prev, current) => (prev.score < current.score) ? prev : current).subject
                  : 'N/A'}
              </div>
            </div>
            
            <div className="bg-blue-900 bg-opacity-40 p-5 rounded-xl shadow-lg flex flex-col items-center justify-center transition-transform duration-200 hover:scale-105 border border-blue-800">
              <div className="text-sm text-blue-300 mb-1">Questions Analyzed</div>
              <div className="text-3xl font-bold text-white">{Object.keys(localAnalysisResults).length}</div>
            </div>
          </div>
          
          {/* Strength & Improvement Areas */}
          {localOverallAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-900 rounded-xl p-6 shadow-lg overflow-y-auto border border-gray-700">
                <div className="flex items-center mb-4">
                  <div className="bg-green-500 bg-opacity-20 p-2 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-green-400">Strengths</h3>
                </div>
                <ul className="space-y-3">
                  {localOverallAnalysis.strengthAreas.map((strength, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-400 mt-2 mr-2"></span>
                      <span className="text-gray-300">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gray-900 rounded-xl p-6 shadow-lg overflow-y-auto border border-gray-700">
                <div className="flex items-center mb-4">
                  <div className="bg-red-500 bg-opacity-20 p-2 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-red-400">Areas for Improvement</h3>
                </div>
                <ul className="space-y-3">
                  {localOverallAnalysis.improvementAreas.map((area, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-400 mt-2 mr-2"></span>
                      <span className="text-gray-300">{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {/* Development Plan */}
          {localOverallAnalysis && (
            <div className="bg-gray-900 p-6 rounded-xl shadow-lg mb-8 border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="bg-blue-500 bg-opacity-20 p-2 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-blue-400">Development Plan</h3>
              </div>
              <div className="bg-black bg-opacity-50 p-4 rounded-lg text-gray-300">
                {localOverallAnalysis.developmentPlan}
              </div>
            </div>
          )}
          
          {/* Render the question details modal */}
          {renderQuestionDetails()}
        </div>
      </div>
    </div>
  );
};

InterviewPerformancePage.propTypes = {
  analysisResults: PropTypes.object,
  overallAnalysis: PropTypes.shape({
    strengthAreas: PropTypes.arrayOf(PropTypes.string),
    improvementAreas: PropTypes.arrayOf(PropTypes.string),
    developmentPlan: PropTypes.string,
  }),
  overallScore: PropTypes.number,
};

export default InterviewPerformancePage;