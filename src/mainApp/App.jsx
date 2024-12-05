import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import SlideshowPage from './pages/SlideShowPage.jsx';

function App() {
  const navigate = useNavigate();

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

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/slideshow" element={<SlideshowPage />} />
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