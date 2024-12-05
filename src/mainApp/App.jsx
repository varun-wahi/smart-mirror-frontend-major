import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import SlideshowPage from './pages/SlideShowPage.jsx';
import FaceAuthenticationPage from './pages/FaceAuthentication.jsx';
import TeacherDataPage from './pages/TeacherDataPage.jsx';

function App() {
  const navigate = useNavigate();
  const [teacherName, setTeacherName] = useState(""); // Store authenticated teacher's name

  useEffect(() => {
    if (typeof window.api === 'undefined') {
      console.error('window.api is undefined. Check preload.js and main.js configuration.');
    } else {
      console.log('window.api is available and ready to use.');

      // Listen for navigation commands from the controller app
      window.api.on('navigate', (path) => {
        console.log('Navigation command received:', path);
        navigate(path); // Navigate to the specified route
      });

      // Clean up the listener on component unmount
      return () => {
        window.api.removeAllListeners('navigate');
      };
    }
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
    </Routes>
  );
}

export default function MainApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}