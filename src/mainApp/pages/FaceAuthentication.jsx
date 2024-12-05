import React, { useRef, useEffect, useState } from "react";

const FaceAuthenticationPage = ({ onAuthenticate }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [message, setMessage] = useState("Initializing...");

  useEffect(() => {
    let videoStream = null;

    // Function to start the webcam
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
        });
        videoRef.current.srcObject = stream;
        videoStream = stream;

        setMessage("Webcam started. Simulating face detection...");
        simulateFaceDetection();
      } catch (error) {
        console.error("Error accessing webcam:", error);
        setMessage("Webcam access denied. Please enable camera permissions.");
      }
    };

    // Simulate face detection and navigate to teacher data page
    const simulateFaceDetection = () => {
      setTimeout(() => {
        setMessage("Face validated! Navigating...");
        onAuthenticate("John Doe"); // Replace "John Doe" with a dynamic teacher name if needed
      }, 3000); // Wait for 3 seconds before navigating
    };

    // Initialize webcam on component mount
    startWebcam();

    // Cleanup on component unmount
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onAuthenticate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <h1 className="text-3xl font-bold mb-4">Face Authentication</h1>
      <div className="relative w-3/4 aspect-video mb-4">
        {/* Webcam Video */}
        <video
          ref={videoRef}
          autoPlay
          muted
          className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
        ></video>

        {/* Canvas for overlays */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        ></canvas>
      </div>
      <p className="mt-4">{message}</p>
    </div>
  );
};

export default FaceAuthenticationPage;