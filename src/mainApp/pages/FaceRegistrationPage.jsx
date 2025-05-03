import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

const FaceRegistrationPage = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [teacherId, setTeacherId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [message, setMessage] = useState("Enter teacher details and capture face");
  const [isCapturing, setIsCapturing] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const API_URL = process.env.REACT_APP_LOCAL_BACKEND_URL || "http://localhost:5020/api";

  useEffect(() => {
    // Start webcam when component mounts
    startWebcam();
    
    // Cleanup on unmount
    return () => {
      stopWebcam();
    };
  }, []);

  const startWebcam = async () => {
    try {
      setCameraError(false);
      stopWebcam(); // Stop any existing stream first
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
        setMessage("Camera ready. Enter teacher details and capture face.");
      }
    } catch (error) {
      console.error("Error accessing webcam:", error);
      setMessage("Webcam access denied. Please enable camera permissions.");
      setCameraError(true);
      setStreamActive(false);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setStreamActive(false);
    }
  };

  const captureFace = () => {
    if (!videoRef.current || !canvasRef.current || !name || !email || !department) {
      setMessage("Please enter all details first");
      return;
    }
    
    if (!streamActive) {
      setMessage("Camera not active. Please allow camera access.");
      startWebcam();
      return;
    }
    
    setIsCapturing(true);
    setMessage("Capturing face...");
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    
    // Set canvas dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data as base64
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.8);
    
    // Send to registration API
    registerFace(imageBase64);
  };

  const registerFace = async (imageBase64) => {
    try {
      // If teacherId is provided, update the teacher; if not, register a new teacher
      const response = await axios.post(`${API_URL}/teacher/register`, {
        imageBase64,
        teacherId: teacherId || undefined,  // If there's no teacherId, send undefined
        name,
        email,
        department
      });
      
      setMessage(`Face registered successfully! Teacher ID: ${response.data.teacherId}`);
      
      // Clear form after successful registration if it's a new teacher
      if (!teacherId) {
        setName("");
        setEmail("");
        setDepartment("");
      }
      
    } catch (error) {
      console.error("Face registration error:", error);
      const errorMsg = error.response?.data?.error || "Registration failed. Please try again.";
      setMessage(errorMsg);
      
      // If no face detected, offer to try again
      if (errorMsg.includes("No face detected")) {
        setMessage("No face detected. Make sure your face is clearly visible and try again.");
      }
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6">Teacher Face Registration</h1>
      
      <div className="w-full max-w-md mb-4 space-y-3">
        <input
          type="text"
          placeholder="Enter Teacher ID (leave blank to register new)"
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      
      <div className="relative w-full max-w-2xl aspect-video mb-6 bg-gray-200 rounded-lg overflow-hidden">
        {/* Webcam Video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Canvas for capture */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />
        
        {!streamActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-70">
            <button 
              onClick={startWebcam}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {cameraError ? "Retry Camera Access" : "Enable Camera"}
            </button>
          </div>
        )}
      </div>
      
      <div className="flex space-x-4">
        <button
          onClick={captureFace}
          disabled={isCapturing || !name || !email || !department || !streamActive}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isCapturing ? "Processing..." : "Capture and Register Face"}
        </button>
        
        <button
          onClick={startWebcam}
          disabled={isCapturing}
          className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-400"
        >
          Restart Camera
        </button>
      </div>
      
      <p className="mt-4 text-center text-lg font-medium">{message}</p>
      
      {cameraError && (
        <div className="mt-4 p-4 bg-yellow-100 text-yellow-800 rounded-lg max-w-md">
          <p className="font-medium">Camera access issues?</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Make sure your browser has camera permissions</li>
            <li>Try using Chrome or Firefox if you're on another browser</li>
            <li>Check if another application is using your camera</li>
            <li>Refresh the page and try again</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default FaceRegistrationPage;