
import React, { useState, useEffect } from 'react';
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
  Cell,
  PieChart,
  Pie,
  Sector
} from 'recharts';

const InterviewPerformancePage = ({ 
  analysisResults = {}, 
  overallAnalysis = null,
  overallScore = null 
}) => {
  const [chartData, setChartData] = useState([]);
  const [radarData, setRadarData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState('radar');
  const [questionDetails, setQuestionDetails] = useState(null);
  
  // Colors for charts
  const COLORS = {
    relevance: '#10b981',    // Green
    completeness: '#3b82f6', // Blue
    clarity: '#8b5cf6',      // Purple
    accuracy: '#f59e0b',     // Amber
    overall: '#ec4899',      // Pink
    strength: '#059669',     // Emerald
    improvement: '#dc2626'   // Red
  };
  
  const RADIAN = Math.PI / 180;
  
  // Custom label for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  useEffect(() => {
    if (Object.keys(analysisResults).length === 0) return;
    
    // Prepare data for charts
    const questions = Object.keys(analysisResults).map(index => parseInt(index));
    setSelectedQuestions(questions);
    
    // Prepare data for line/bar charts
    const lineData = questions.map(index => ({
      name: `Q${parseInt(index) + 1}`,
      relevance: analysisResults[index].relevanceScore,
      completeness: analysisResults[index].completenessScore,
      clarity: analysisResults[index].clarityScore,
      accuracy: analysisResults[index].accuracyScore,
      overall: analysisResults[index].overallScore,
      questionIndex: index // Store the index for lookup
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
      avgScores.relevance += analysisResults[index].relevanceScore;
      avgScores.completeness += analysisResults[index].completenessScore;
      avgScores.clarity += analysisResults[index].clarityScore;
      avgScores.accuracy += analysisResults[index].accuracyScore;
    });
    
    const count = questions.length;
    const radar = [
      { 
        subject: 'Relevance', 
        score: avgScores.relevance / count,
        fullMark: 10 
      },
      { 
        subject: 'Completeness', 
        score: avgScores.completeness / count,
        fullMark: 10 
      },
      { 
        subject: 'Clarity', 
        score: avgScores.clarity / count,
        fullMark: 10 
      },
      { 
        subject: 'Accuracy', 
        score: avgScores.accuracy / count,
        fullMark: 10 
      }
    ];
    
    setRadarData(radar);
    
    // Prepare data for pie chart
    if (overallAnalysis) {
      const pieData = [
        { name: 'Strengths', value: overallAnalysis.strengthAreas.length, color: COLORS.strength },
        { name: 'Improvements', value: overallAnalysis.improvementAreas.length, color: COLORS.improvement }
      ];
      setPieData(pieData);
    }
  }, [analysisResults, overallAnalysis]);
  
  // Handle bar chart click to show question details
  const handleBarClick = (data) => {
    const index = data.questionIndex;
    setQuestionDetails({
      index,
      ...analysisResults[index]
    });
  };
  
  // Close question details modal
  const closeDetails = () => {
    setQuestionDetails(null);
  };
  
  // Render question details modal
  const renderQuestionDetails = () => {
    if (!questionDetails) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Question {parseInt(questionDetails.index) + 1} Analysis</h3>
            <button onClick={closeDetails} className="text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-700 p-3 rounded">
              <span className="text-sm text-gray-400">Relevance</span>
              <div className="text-xl font-bold">{questionDetails.relevanceScore}/10</div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <span className="text-sm text-gray-400">Completeness</span>
              <div className="text-xl font-bold">{questionDetails.completenessScore}/10</div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <span className="text-sm text-gray-400">Clarity</span>
              <div className="text-xl font-bold">{questionDetails.clarityScore}/10</div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <span className="text-sm text-gray-400">Accuracy</span>
              <div className="text-xl font-bold">{questionDetails.accuracyScore}/10</div>
            </div>
          </div>
          
          <div className="bg-gray-700 p-4 rounded mb-4">
            <h4 className="font-medium mb-2">Feedback</h4>
            <p className="text-gray-300">{questionDetails.feedback}</p>
          </div>
          
          {questionDetails.improvementSuggestions && (
            <div className="bg-gray-700 p-4 rounded">
              <h4 className="font-medium mb-2">Improvement Suggestions</h4>
              <p className="text-gray-300">{questionDetails.improvementSuggestions}</p>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  if (Object.keys(analysisResults).length === 0) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg text-center text-gray-400">
        No analysis data available. Analyze your answers to see performance metrics.
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Performance Visualization</h2>
      
      <div className="flex border-b border-gray-700 mb-4 overflow-x-auto pb-1">
        <button 
          className={`px-4 py-2 ${activeTab === 'radar' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('radar')}
        >
          Skill Radar
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'bar' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('bar')}
        >
          Question Scores
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'line' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('line')}
        >
          Score Trends
        </button>
        {overallAnalysis && (
          <button 
            className={`px-4 py-2 ${activeTab === 'strengths' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}
            onClick={() => setActiveTab('strengths')}
          >
            Strengths & Improvements
          </button>
        )}
      </div>
      
      <div className="h-80 mb-4">
        {activeTab === 'radar' && (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#4b5563" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#e5e7eb' }} />
              <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#9ca3af' }} />
              <Radar
                name="Skills"
                dataKey="score"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
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
              onClick={(data) => data && data.activePayload && handleBarClick(data.activePayload[0].payload)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" tick={{ fill: '#e5e7eb' }} />
              <YAxis domain={[0, 10]} tick={{ fill: '#9ca3af' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
              />
              <Legend />
              <Bar dataKey="relevance" name="Relevance" fill={COLORS.relevance} />
              <Bar dataKey="completeness" name="Completeness" fill={COLORS.completeness} />
              <Bar dataKey="clarity" name="Clarity" fill={COLORS.clarity} />
              <Bar dataKey="accuracy" name="Accuracy" fill={COLORS.accuracy} />
              <Bar dataKey="overall" name="Overall" fill={COLORS.overall} />
            </BarChart>
          </ResponsiveContainer>
        )}
        
        {activeTab === 'line' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" tick={{ fill: '#e5e7eb' }} />
              <YAxis domain={[0, 10]} tick={{ fill: '#9ca3af' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                formatter={(value) => [`${value}/10`, '']}
              />
              <Legend />
              <Line type="monotone" dataKey="relevance" name="Relevance" stroke={COLORS.relevance} strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="completeness" name="Completeness" stroke={COLORS.completeness} strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="clarity" name="Clarity" stroke={COLORS.clarity} strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="accuracy" name="Accuracy" stroke={COLORS.accuracy} strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="overall" name="Overall" stroke={COLORS.overall} strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
        
        {activeTab === 'strengths' && overallAnalysis && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            <div className="bg-gray-700 rounded-lg p-4 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-3 text-green-400">Strengths</h3>
              <ul className="list-disc pl-5 space-y-2">
                {overallAnalysis.strengthAreas.map((strength, idx) => (
                  <li key={idx} className="text-sm text-gray-300">{strength}</li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-3 text-red-400">Areas for Improvement</h3>
              <ul className="list-disc pl-5 space-y-2">
                {overallAnalysis.improvementAreas.map((area, idx) => (
                  <li key={idx} className="text-sm text-gray-300">{area}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700 p-4 rounded-lg flex flex-col items-center">
          <div className="text-sm text-gray-400">Overall Score</div>
          <div className="text-2xl font-bold">{overallScore || 
            (Object.keys(analysisResults).length > 0 
              ? (Object.values(analysisResults).reduce((sum, r) => sum + r.overallScore, 0) / Object.keys(analysisResults).length).toFixed(1)
              : 'N/A')
          }</div>
        </div>
        
        <div className="bg-gray-700 p-4 rounded-lg flex flex-col items-center">
          <div className="text-sm text-gray-400">Strongest Area</div>
          <div className="text-lg font-bold">
            {radarData.length > 0 
              ? radarData.reduce((prev, current) => (prev.score > current.score) ? prev : current).subject
              : 'N/A'}
          </div>
        </div>
        
        <div className="bg-gray-700 p-4 rounded-lg flex flex-col items-center">
          <div className="text-sm text-gray-400">Needs Improvement</div>
          <div className="text-lg font-bold">
            {radarData.length > 0 
              ? radarData.reduce((prev, current) => (prev.score < current.score) ? prev : current).subject
              : 'N/A'}
          </div>
        </div>
        
        <div className="bg-gray-700 p-4 rounded-lg flex flex-col items-center">
          <div className="text-sm text-gray-400">Questions Analyzed</div>
          <div className="text-2xl font-bold">{Object.keys(analysisResults).length}</div>
        </div>
      </div>
      
      {/* Additional Development Plan Based on Overall Analysis */}
      {overallAnalysis && (
        <div className="bg-gray-700 p-4 rounded-lg mb-2">
          <h3 className="text-lg font-semibold mb-2">Development Plan</h3>
          <p className="text-sm text-gray-300">{overallAnalysis.developmentPlan}</p>
        </div>
      )}
      
      {/* Render the question details modal */}
      {renderQuestionDetails()}
    </div>
  );
}

export default InterviewPerformancePage;