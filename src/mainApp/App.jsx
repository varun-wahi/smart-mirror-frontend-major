import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import SlideshowPage from './pages/SlideShowPage.jsx';
import FaceAuthenticationPage from './pages/FaceAuthentication.jsx';
import TeacherDataPage from './pages/TeacherDataPage.jsx';
import InterviewPracticePage from './pages/InterviewPracticePage.jsx';
import { InterviewProvider } from './utils/InterviewContext.jsx';

import { useInterview } from "./utils/InterviewContext"; // adjust the path if needed

function App() {
  const navigate = useNavigate();
  const { setInterviewData } = useInterview();
  const [teacherName, setTeacherName] = useState(""); // Store authenticated teacher's name

  // useEffect(() => {
  //   if (typeof window.api === 'undefined') {
  //     console.error('window.api is undefined. Check preload.js and main.js configuration.');
  //   } else {
  //     console.log('window.api is available and ready to use.');

  //     // Listen for navigation commands from the controller app
  //     window.api.on('navigate', (path) => {
  //       console.log('Navigation command received:', path);
  //       navigate(path); // Navigate to the specified route
  //     });

  //     // Clean up the listener on component unmount
  //     return () => {
  //       window.api.removeAllListeners('navigate');
  //     };
  //   }
  // }, [navigate]);


  useEffect(() => {
    if (!window.api) return;
  
    const handleNavigation = (data) => {
      console.log("Navigation command received:", data);
  
      if (typeof data === "string") {
        navigate(data);
      } else if (typeof data === "object" && data.path) {
        const { path, topic, difficulty, questionCount } = data;
        if (topic && difficulty && questionCount) {
          setInterviewData({ topic, difficulty, questionCount });
        }
        navigate(path);
      } else {
        console.error("Invalid navigation data received:", data);
      }
    };
  
    window.api.on("navigate", handleNavigation);
  
    return () => {
      window.api.removeAllListeners("navigate");
    };
  }, [navigate]);

  // Handle successful face authentication
  const handleAuthentication = (name) => {
    setTeacherName(name); // Store the teacher's name
    navigate("/teacher-data"); // Navigate to TeacherDataPage
  };

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/slideshow" element={<SlideshowPage />} />
      <Route
        path="/face-authentication"
        element={<FaceAuthenticationPage onAuthenticate={handleAuthentication} />}
      />
      <Route
        path="/teacher-data"
        element={<TeacherDataPage teacherName={teacherName} />}
      />
      <Route path="/interview-practice" element={<InterviewPracticePage />} />
    </Routes>
  );
}

export default function MainApp() {
  return (
    <Router>
      <InterviewProvider>
        <App />
      </InterviewProvider>
    </Router>
  );
}