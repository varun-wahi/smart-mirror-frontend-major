import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const FaceAuthenticationPage = () => {
  const [message, setMessage] = useState("Initializing face recognition...");
  const [recognizedPerson, setRecognizedPerson] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastFaceDetectedTime, setLastFaceDetectedTime] = useState(Date.now());
  const navigate = useNavigate();
  const videoRef = useRef(null);
  
  // Backend API URL
  const API_URL = process.env.PYTHON_LOCAL_BACKEND_URL || "http://localhost:5030";

  useEffect(() => {
    // Function to speak greeting
    const speakGreeting = (name) => {
      if ('speechSynthesis' in window) {
        const greeting = new SpeechSynthesisUtterance(`Welcome, ${name}! Your attendance has been logged.`);
        greeting.rate = 1; // Slightly slower
        greeting.pitch = 1;
        window.speechSynthesis.speak(greeting);
      }
    };

    // Function to poll for recognitions
    const checkForRecognition = async () => {
      try {
        const response = await axios.get(`${API_URL}/check_recognition`);
        
        if (response.data.recognized && 
            (!recognizedPerson || recognizedPerson !== response.data.name)) {
          
          // Update recognized person
          setRecognizedPerson(response.data.name);
          
          // Display name
          setMessage(`Welcome, ${response.data.name}!`);
          
          // Show success animation
          setShowSuccess(true);
          
          // Speak greeting
          speakGreeting(response.data.name);
          
          // Navigate to home page after 3 seconds
          setTimeout(() => {
            navigate("/");
          }, 3000);
        }
        
        // Update last face detection time when a face is present
        if (response.data.face_detected) {
          setLastFaceDetectedTime(Date.now());
        } else {
          // Check if 5 seconds passed with no face detected
          const timeSinceLastFace = Date.now() - lastFaceDetectedTime;
          if (timeSinceLastFace > 5000 && !recognizedPerson) {
            setMessage("No face detected. Returning to home...");
            setTimeout(() => {
              navigate("/");
            }, 1000); // Brief delay to show the message
          }
        }
      } catch (error) {
        console.error("Error checking recognition:", error);
      }
    };

    // Set up polling interval
    const pollingInterval = setInterval(checkForRecognition, 1000); // Check every second
    
    // Clean up on unmount
    return () => {
      clearInterval(pollingInterval);
    };
  }, [API_URL, navigate, recognizedPerson, lastFaceDetectedTime]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-4">
      <h1 className="text-3xl font-bold mb-6">Face Authentication</h1>
      
      <div className="relative w-full max-w-2xl aspect-video mb-6">
        {/* Video Stream from Python Backend */}
        <img 
          src={`${API_URL}/video_feed`} 
          className="w-full h-full object-cover rounded-lg"
          alt="Face recognition video feed"
        />
        
        {/* Success animation overlay */}
        {showSuccess && (
          <div className="absolute inset-0 bg-green-500 bg-opacity-30 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="inline-block p-4 rounded-full bg-green-500">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-16 w-16 text-white" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-white">
                Attendance Logged!
              </h2>
              {recognizedPerson && (
                <p className="mt-2 text-xl text-white">Welcome, {recognizedPerson}</p>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="text-center">
        <p className="text-xl mb-2">{message}</p>
        {!recognizedPerson && !showSuccess && (
          <div className="mt-2 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceAuthenticationPage;
