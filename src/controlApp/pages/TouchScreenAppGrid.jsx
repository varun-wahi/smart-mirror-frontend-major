import React, { useState } from "react";
import axios from "axios";

// List of applications with their navigation actions
const apps = [
  { name: "Home", action: "navigate", data: "/", icon: "icons/home.png" },
  { name: "Slideshow", action: "navigate", data: "/slideshow", icon: "icons/slideshow.png" },
  { name: "Teacher Data", action: "navigate", data: "/face-authentication", icon: "icons/teacher.png" },
  { name: "Interview Practice", action: "navigate", data: "/interview-practice", icon: "icons/interview.png" },
];

const TouchscreenAppGrid = () => {
  // State to manage the motion detection toggle
  const [isMotionActive, setIsMotionActive] = useState(false);

  // Function to toggle motion detection
  const toggleMotionDetection = async () => {
    try {
      if (isMotionActive) {
        // Stop motion detection API call
        await axios.post("http://localhost:5020/api/motion/stop");
        console.log("Motion detection stopped.");
      } else {
        // Start motion detection API call
        await axios.post("http://localhost:5020/api/motion/start");
        console.log("Motion detection started.");
      }
      // Update the state
      setIsMotionActive(!isMotionActive);
    } catch (error) {
      console.error("Error toggling motion detection:", error);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-6 bg-black h-screen">
      {/* Application buttons */}
      {apps.map((app, index) => (
        <button
          key={index}
          onClick={() => window.api?.send(app.action, app.data)} // Send navigation commands via IPC
          className="flex flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-zinc-900 hover:from-gray-700 hover:to-zinc-800 active:from-gray-600 active:to-zinc-700 rounded-xl shadow-lg p-6 transition-transform transform hover:scale-105 focus:ring-2 focus:ring-teal-500"
          aria-label={`Open ${app.name}`}
        >
          {/* App Icon */}
          <img
            src={app.icon}
            alt={`${app.name} Icon`}
            className="w-16 h-16 mb-2"
            onError={(e) => {
              e.target.onerror = null; // Prevent infinite loop
              e.target.src = "icons/default.png"; // Fallback to default icon
            }}
          />
          {/* App Name */}
          <div className="text-white text-center text-sm font-medium">{app.name}</div>
        </button>
      ))}

      {/* Motion Detection Toggle Button */}
      <button
        onClick={toggleMotionDetection}
        className={`flex flex-col items-center justify-center ${
          isMotionActive ? "bg-green-600" : "bg-red-600"
        } hover:bg-opacity-80 active:bg-opacity-70 rounded-xl shadow-lg p-6 transition-transform transform hover:scale-105 focus:ring-2 focus:ring-teal-500`}
        aria-label="Toggle Motion Detection"
      >
        {/* Motion Icon */}
        <img
          src="icons/motion.png"
          alt="Motion Icon"
          className="w-16 h-16 mb-2"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "icons/default.png"; // Fallback to default icon
          }}
        />
        {/* Toggle Text */}
        <div className="text-white text-center text-sm font-medium">
          {isMotionActive ? "Stop Motion" : "Start Motion"}
        </div>
      </button>
    </div>
  );
};

export default TouchscreenAppGrid;