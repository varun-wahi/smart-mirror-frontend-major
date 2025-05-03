import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const FaceAuthenticationPage = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [message, setMessage] = useState("Initializing...");
  const [recognizing, setRecognizing] = useState(false);
  const [teacherData, setTeacherData] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  
  const API_URL = process.env.REACT_APP_LOCAL_BACKEND_URL || "http://localhost:5020/api";

  useEffect(() => {
    let videoStream = null;
    let captureInterval = null;
    
    // Function to start the webcam
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoStream = stream;
          setMessage("Looking for face...");
          startFaceCapture();
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
        setMessage("Webcam access denied. Please enable camera permissions.");
      }
    };
    
    // Function to start periodic face capture and recognition
    const startFaceCapture = () => {
      captureInterval = setInterval(() => {
        if (!recognizing) {
          captureAndVerifyFace();
        }
      }, 2000); // Check every 2 seconds
    };
    
    // Function to capture image from video and send for verification
    const captureAndVerifyFace = async () => {
      if (!videoRef.current || !canvasRef.current || recognizing) return;
      
      setRecognizing(true);
      
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        
        // Set canvas dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Add visual feedback - draw frame
        context.strokeStyle = "#3498db";
        context.lineWidth = 3;
        context.strokeRect(0, 0, canvas.width, canvas.height);
        
        // Get image data as base64
        const imageBase64 = canvas.toDataURL("image/jpeg");
        
        setMessage("Analyzing face...");
        
        // Send to API for verification
        const response = await axios.post(`${API_URL}/teacher/verify`, {
          imageBase64
        });
        
        if (response.data.recognized) {
          // Face recognized successfully
          const teacher = response.data.teacher;
          setTeacherData(teacher);
          setMessage(`Welcome, ${teacher.name}!`);
          
          // Speak greeting
          speakGreeting(teacher.name);
          
          // Show success animation
          setShowSuccess(true);
          
          // Navigate to teacher data page after delay
          setTimeout(() => {
            navigate("/teacher-data", { state: { teacherData: teacher } });
          }, 3000);
        }
      } catch (error) {
        console.error("Face verification error:", error);
        setMessage(error.response?.data?.error || "Face verification failed. Please try again.");
        setTimeout(() => setRecognizing(false), 1000);
      }
    };
    
    // Function to speak greeting
    const speakGreeting = (name) => {
      if ('speechSynthesis' in window) {
        const greeting = new SpeechSynthesisUtterance(`Welcome, ${name}! Your attendance has been logged.`);
        greeting.rate = 0.9; // Slightly slower
        greeting.pitch = 1;
        window.speechSynthesis.speak(greeting);
      }
    };
    
    // Initialize webcam on component mount
    startWebcam();
    
    // Cleanup on component unmount
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
      if (captureInterval) {
        clearInterval(captureInterval);
      }
    };
  }, [recognizing, navigate, API_URL]);
  
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-4">
      <h1 className="text-3xl font-bold mb-6">Teacher Authentication</h1>
      
      <div className="relative w-full max-w-2xl aspect-video mb-6">
        {/* Webcam Video */}
        <video
          ref={videoRef}
          autoPlay
          muted
          className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
        />
        
        {/* Canvas for overlays */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full rounded-lg"
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
              {teacherData && (
                <p className="mt-2 text-xl text-white">Welcome, {teacherData.name}</p>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="text-center">
        <p className="text-xl mb-2">{message}</p>
        {recognizing && !showSuccess && (
          <div className="mt-2 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceAuthenticationPage;