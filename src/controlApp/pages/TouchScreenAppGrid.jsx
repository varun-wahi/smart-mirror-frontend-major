import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const apps = [
  { name: "Home", action: "navigate", data: "/", icon: "icons/home.png" },
  { name: "Slideshow", action: "navigate", data: "/slideshow", icon: "icons/slideshow.png" },
  { name: "Teacher Data", action: "navigate", data: "/face-authentication", icon: "icons/teacher.png" },
  { name: "Interview Practice", action: "navigate", data: "/interview-practice", icon: "icons/interview.png" },
  // { name: "Teacher Registration", action: "navigate", data: "/register-face", icon: "icons/teacher.png" },
];

const TouchscreenAppGrid = () => {
  const [isMotionActive, setIsMotionActive] = useState(false);
  const navigate = useNavigate();

  const handleShutdown = async () => {
    if (window.confirm("Are you sure you want to shut down the system?")) {
      try {
        const response = await axios.post("http://localhost:5030/shutdown");
        console.log("Shutdown command sent:", response.data);
      } catch (error) {
        console.error("Error sending shutdown command:", error);
      }
    }
  };

  const handleAppClick = (app) => {
    if (app.name === "Interview Practice") {
      // Go to topic selection screen in controller app
      navigate("/select-topic");
    } else {
      // Send IPC to display app
      if (window.api) {
        window.api.send("navigate", { path: app.data });
        console.log("Sent to display:", app.data);
      } else {
        console.error("IPC not available");
      }
    }
  };

  const toggleMotionDetection = async () => {
    try {
      let response;

      if (isMotionActive) {
        response = await axios.post("http://localhost:5030/led/on");
        console.log("Lights off.");
      } else {
        response = await axios.post("http://localhost:5030/led/off");
        console.log("Lights on.");
      }

      console.log("Server Response:", response.data);
      setIsMotionActive(!isMotionActive);
    } catch (error) {
      console.error("Error toggling motion detection:", error);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-6 bg-black h-screen">
      {apps.map((app, index) => (
        <button
          key={index}
          onClick={() => handleAppClick(app)}
          className="flex flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-zinc-900 hover:from-gray-700 hover:to-zinc-800 active:from-gray-600 active:to-zinc-700 rounded-xl shadow-lg p-6 transition-transform transform hover:scale-105 focus:ring-2 focus:ring-teal-500"
        >
          <img
            src={app.icon}
            alt={`${app.name} Icon`}
            className="w-16 h-16 mb-2"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "icons/default.png";
            }}
          />
          <div className="text-white text-center text-sm font-medium">
            {app.name}
          </div>
        </button>
      ))}

      <button
        onClick={toggleMotionDetection}
        className={`flex flex-col items-center justify-center ${isMotionActive ? "bg-green-600" : "bg-red-600"
          } hover:bg-opacity-80 active:bg-opacity-70 rounded-xl shadow-lg p-6 transition-transform transform hover:scale-105 focus:ring-2 focus:ring-teal-500`}
        aria-label="Toggle Lights"
      >
        <img
          src="icons/bulb.png"
          alt="Bulb Icon"
          className="w-16 h-16 mb-2"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "icons/default.png";
            }}
          />
          <div className="text-white text-center text-sm font-medium">
            {isMotionActive ? "Stop Light" : "Start Light"}
          </div>
          </button>

          <div className="col-span-2 flex gap-4">
  <button
    onClick={handleShutdown}
    className="flex-1 flex items-center justify-center bg-red-700 hover:bg-red-600 text-white rounded-xl shadow-lg p-6 text-center font-semibold text-lg transition-transform transform hover:scale-105 focus:ring-2 focus:ring-red-500"
    aria-label="Shutdown System"
  >
    Shutdown
  </button>

  <button
    onClick={async () => {
      if (window.confirm("Are you sure you want to reboot the system?")) {
        try {
          const response = await axios.post("http://localhost:5030/reboot");
          console.log("Reboot command sent:", response.data);
        } catch (error) {
          console.error("Error sending reboot command:", error);
        }
      }
    }}
    className="flex-1 flex items-center justify-center bg-orange-600 hover:bg-orange-500 text-white rounded-xl shadow-lg p-6 text-center font-semibold text-lg transition-transform transform hover:scale-105 focus:ring-2 focus:ring-orange-400"
    aria-label="Reboot System"
  >
    Reboot
  </button>
</div>
    </div>
  );
};

export default TouchscreenAppGrid;