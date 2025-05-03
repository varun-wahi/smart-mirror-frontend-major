import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const TeacherDataPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState('');
  const [notices, setNotices] = useState([]);
  
  const API_URL = process.env.REACT_APP_LOCAL_BACKEND_URL || "http://localhost:5000/api";

  useEffect(() => {
    // Get current day of the week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    setCurrentDay(today);

    // Check if we have teacher data from navigation state
    if (location.state?.teacherData) {
      setTeacherData(location.state.teacherData);
      fetchNotices(location.state.teacherData.id);
      setLoading(false);
    } else {
      // If no data, redirect to authentication page
      navigate("/");
    }
  }, [location.state, navigate]);

  // Fetch school notices
  const fetchNotices = async (teacherId) => {
    try {
      const response = await axios.get(`${API_URL}/notices`);
      setNotices(response.data);
    } catch (error) {
      console.error("Error fetching notices:", error);
      // Use mock notices as fallback
      setNotices([
        "Parent-Teacher Meeting on Friday at 4 PM",
        "Submit attendance reports by end of the week",
        "Holiday on Monday for Teacher's Day",
        "Staff meeting tomorrow at 3:30 PM"
      ]);
    }
  };

  // Get current time period
  const getCurrentPeriod = () => {
    if (!teacherData) return null;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute; // Convert to minutes
    
    // Find today's schedule
    const todaySchedule = teacherData.schedule.find(s => s.day === currentDay);
    
    if (!todaySchedule) return null;
    
    // Find current or next period
    for (const period of todaySchedule.periods) {
      const [startHour, startMinute] = period.time.split(' - ')[0].split(':').map(Number);
      const [endHour, endMinute] = period.time.split(' - ')[1].split(':').map(Number);
      
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;
      
      if (currentTime >= startTime && currentTime <= endTime) {
        return { ...period, status: 'current' };
      } else if (currentTime < startTime) {
        return { ...period, status: 'next' };
      }
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Get current or next class period
  const currentPeriod = getCurrentPeriod();
  
  // Get today's schedule
  const todaySchedule = teacherData.schedule.find(s => s.day === currentDay);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-6">
      {/* Header with welcome message and time */}
      <header className="w-full max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Welcome, {teacherData.name}</h1>
          <p className="text-gray-400">
            Attendance logged at {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="mt-4 md:mt-0 text-right">
          <p className="text-2xl">{new Date().toLocaleDateString()}</p>
          <p className="text-xl text-gray-400">{currentDay}</p>
        </div>
      </header>

      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current/Next Class Card */}
        <div className="lg:col-span-1 bg-gray-800 rounded-lg p-6 h-min">
          <h2 className="text-2xl font-semibold mb-4">
            {currentPeriod?.status === 'current' ? 'Current Class' : 'Next Class'}
          </h2>
          
          {currentPeriod ? (
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-medium">{currentPeriod.subject}</span>
                <span className="text-sm bg-blue-500 px-2 py-1 rounded">
                  {currentPeriod.time}
                </span>
              </div>
              <p className="text-gray-400">Class: {currentPeriod.class}</p>
            </div>
          ) : (
            <p className="text-gray-400">No more classes scheduled for today</p>
          )}
        </div>

        {/* Today's Timetable */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Today's Timetable</h2>
          
          {todaySchedule ? (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Subject</th>
                  <th className="py-2 px-3">Class</th>
                </tr>
              </thead>
              <tbody>
                {todaySchedule.periods.map((period, index) => (
                  <tr 
                    key={index} 
                    className={`border-b border-gray-700 ${
                      currentPeriod?.time === period.time ? 'bg-blue-900 bg-opacity-30' : ''
                    }`}
                  >
                    <td className="py-3 px-3">{period.time}</td>
                    <td className="py-3 px-3">{period.subject}</td>
                    <td className="py-3 px-3">{period.class}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-400">No classes scheduled for today</p>
          )}
        </div>

        {/* Notices Section */}
        <div className="lg:col-span-3 bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Important Notices</h2>
          
          {notices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notices.map((notice, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4 flex items-start">
                  <div className="mr-3 mt-1">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 text-yellow-400" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </div>
                  <span>{notice}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No notices for today</p>
          )}
        </div>
      </div>

      {/* Sign Out Button */}
      <div className="w-full max-w-6xl mx-auto mt-6 flex justify-end">
        <button 
          onClick={() => navigate("/")}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default TeacherDataPage;