import React from "react";

const apps = [
  { name: "Home", action: "navigate", data: "/", icon: "icons/home.png" },
  { name: "Slideshow", action: "navigate", data: "/slideshow", icon: "icons/slideshow.png" },
  { name: "Teacher Data", action: "navigate", data: "/teacher-data", icon: "icons/teacher.png" },
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
    <div className="grid grid-cols-2 gap-6 p-6 bg-black h-screen">
      {apps.map((app, index) => (
        <button
          key={index}
          onClick={() => handleButtonClick(app.action, app.data)}
          className="flex flex-col items-center justify-center bg-zinc-900 hover:bg-zinc-800 active:bg-gray-600 rounded-xl shadow-lg p-6"
        >
          {/* App Icon */}
          <img
            src={app.icon}
            alt={`${app.name} Icon`}
            className="w-12 h-12 mb-2"
          />
          {/* App Name */}
          <div className="text-white text-sm font-medium">{app.name}</div>
        </button>
      ))}
    </div>
  );
};

export default TouchscreenAppGrid;