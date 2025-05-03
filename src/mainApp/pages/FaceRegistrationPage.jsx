// components/FaceRegistrationPage.js
import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';

const FaceRegistrationPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [message, setMessage] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  
  useEffect(() => {
    // Fetch available teachers
    const fetchTeachers = async () => {
      try {
        const response = await axios.get(`${API_URL}/teachers`);
        setTeachers(response.data);
      } catch (error) {
        console.error('Error fetching teachers:', error);
        setMessage('Failed to load teachers');
      }
    };
    
    fetchTeachers();
  }, [API_URL]);
  
  const startCamera = async () => {
    if (!selectedTeacher) {
      setMessage('Please select a teacher first');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setMessage('Camera started. Position face and click "Capture"');
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      setMessage('Failed to start camera');
    }
  };
  
  const captureAndRegister = async () => {
    if (!videoRef.current || !canvasRef.current || !selectedTeacher) {
      setMessage('Camera not active or teacher not selected');
      return;
    }
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageBase64 = canvas.toDataURL('image/jpeg');
      
      setMessage('Registering face...');
      
      const response = await axios.post(`${API_URL}/face/register`, {
        teacherId: selectedTeacher,
        imageBase64
      });
      
      setMessage('Face registered successfully!');
      
      // Stop camera
      stopCamera();
    } catch (error) {
      console.error('Face registration error:', error);
      setMessage('Face registration failed. Please try again.');
    }
  };
  
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">Teacher Face Registration</h1>
      
      <div className="w-full max-w-md bg-gray-800 rounded-lg p-6 mb-6">
        <label className="block mb-2">Select Teacher:</label>
        <select 
          value={selectedTeacher} 
          onChange={(e) => setSelectedTeacher(e.target.value)}
          className="w-full p-2 bg-gray-700 rounded mb-4"
          disabled={isCameraActive}
        >
          <option value="">-- Select Teacher --</option>
          {teachers.map(teacher => (
            <option key={teacher._id} value={teacher._id}>
              {teacher.name} - {teacher.department}
            </option>
          ))}
        </select>
        
        {!isCameraActive ? (
          <button 
            onClick={startCamera}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded mb-2"
            disabled={!selectedTeacher}
          >
            Start Camera
          </button>
        ) : (
          <div className="flex space-x-2">
            <button 
              onClick={captureAndRegister}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded mb-2"
            >
              Capture
            </button>
            <button 
              onClick={stopCamera}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded mb-2"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      
      <div className="relative w-full max-w-md aspect-video mb-4">
        {/* Video display */}
        <video
          ref={videoRef}
          autoPlay
          muted
          className={`w-full h-full object-cover rounded-lg ${!isCameraActive ? 'hidden' : ''}`}
        ></video>
        
        {/* Canvas for capture */}
        <canvas
          ref={canvasRef}
          className="hidden"
        ></canvas>
        
        {/* Placeholder when camera is off */}
        {!isCameraActive && (
          <div className="absolute inset-0 bg-gray-700 flex items-center justify-center rounded-lg">
            <p>Camera inactive</p>
          </div>
        )}
      </div>
      
      {message && (
        <div className="mt-4 p-3 rounded bg-gray-700">
          {message}
        </div>
      )}
    </div>
  );
};

export default FaceRegistrationPage;