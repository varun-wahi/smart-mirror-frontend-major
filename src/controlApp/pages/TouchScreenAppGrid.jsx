import React from "react";

const apps = [
  { name: "Home", action: "navigate", data: "/", icon: "icons/home.png" },
  { name: "Slideshow", action: "navigate", data: "/slideshow", icon: "icons/slideshow.png" },
  { name: "Teacher Data", action: "navigate", data: "/face-authentication", icon: "icons/teacher.png" },
  { name: "Interview Practice", action: "navigate", data: "/interview-practice", icon: "icons/interview.png" },
];

const TouchscreenAppGrid = () => {
  const handleButtonClick = (action, data) => {
    if (window.api) {
      window.api.send(action, data); // Send navigation command to main process
    } else {
      console.error("window.api is undefined");
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-6 bg-black h-screen">
      {apps.map((app, index) => (
        <button
          key={index}
          onClick={() => handleButtonClick(app.action, app.data)}
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
    </div>
  );
};

export default TouchscreenAppGrid;