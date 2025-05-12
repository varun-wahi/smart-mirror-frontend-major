import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const FaceAuthenticationPage = () => {
  const [message, setMessage] = useState("Initializing face recognition...");
  const [recognizedPerson, setRecognizedPerson] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  const [showVideo, setShowVideo] = useState(false);

  const videoRef = useRef(null);
  const API_URL = "http://localhost:5030";
  
  useEffect(() => {
    // Start the camera on backend
    const startCamera = async () => {
      try {
        await axios.post(`${API_URL}/start_camera`);
        console.log("Camera started");
  
        // Delay showing the video feed
        setTimeout(() => {
          setShowVideo(true);
          setMessage("Looking for faces...");
        }, 2000); // Reduced to 2 seconds for better UX
      } catch (error) {
        console.error("Failed to start camera:", error);
        setMessage("Camera error. Please try again.");
      }
    };
  
    startCamera();
    
    // Cleanup function
    return () => {
      // Stop camera on unmount
      axios.post(`${API_URL}/stop_camera`)
        .catch(error => console.error("Failed to stop camera:", error));
    };
  }, []);

  useEffect(() => {
    // Function to make the backend speak
    const speakGreeting = async (name) => {
      try {
        await axios.post(`${API_URL}/speak`, {
          text: `Welcome, ${name}! Your attendance has been logged.`
        });
        console.log("Speech request sent to backend");
      } catch (error) {
        console.error("Error sending speech request:", error);
      }
    };

    // Function to poll for recognitions
    const checkForRecognition = async () => {
      if (!showVideo) return; // Don't check if video isn't showing yet
      
      try {
        const response = await axios.get(`${API_URL}/check_recognition`);

        if (response.data.recognized &&
          (!recognizedPerson || recognizedPerson !== response.data.name)) {

          // Update recognized person
          setRecognizedPerson(response.data.name);

          // Clear the message since we'll show name in success overlay
          setMessage("");

          // Show success animation
          setShowSuccess(true);

          // Use backend to speak greeting
          speakGreeting(response.data.name);

          // Navigate to another page after delay
          setTimeout(() => {
            navigate("/");
          }, 3000);
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
  }, [API_URL, navigate, recognizedPerson, showVideo]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <h1 className="text-2xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
        Face Authentication
      </h1>

      {/* Camera Container - Increased to 80% width */}
      <div className="relative w-4/5 aspect-video mb-4">
        {/* Video Stream */}
        {showVideo ? (
          <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl border-2 border-gray-800">
            <img
              src={`${API_URL}/video_feed`}
              className="w-full h-full object-cover"
              alt="Face recognition video feed"
            />
            
            {/* Scanning effect when not recognized yet */}
            {!showSuccess && (
              <div className="absolute inset-0 border-4 border-blue-500 opacity-30 rounded-xl animate-pulse"></div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-xl border-2 border-gray-700">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mb-4"></div>
              <p className="text-white text-lg">Initializing camera...</p>
            </div>
          </div>
        )}

        {/* Success animation overlay - Made larger and more prominent */}
        {showSuccess && (
          <div className="absolute inset-0 bg-green-500 bg-opacity-40 backdrop-blur-sm flex items-center justify-center rounded-xl">
            <div className="text-center transform scale-110 transition-all duration-500">
              <div className="inline-block p-6 rounded-full bg-green-500 shadow-lg animate-bounce">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-20 w-20 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-bold text-white text-shadow">
                Attendance Logged!
              </h2>
              {recognizedPerson && (
                <p className="mt-2 text-2xl text-white font-medium">
                  Welcome, {recognizedPerson}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status message - Only shown when not in success state */}
      {!showSuccess && message && (
        <div className="text-center">
          <div className="px-6 py-2 bg-gray-800 bg-opacity-70 rounded-full">
            <p className="text-lg">{message}</p>
            {message.includes("Looking") && (
              <div className="mt-2 flex justify-center">
                <div className="animate-pulse flex space-x-1">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceAuthenticationPage;