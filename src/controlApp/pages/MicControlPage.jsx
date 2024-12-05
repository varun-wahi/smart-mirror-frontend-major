import React from "react";

const MicControlPage = () => {
  const handleMicClick = () => {
    console.log("Mic button clicked!");
    // You can implement actual mic handling logic here
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <button
        onClick={handleMicClick}
        className="w-20 h-20 bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-full flex items-center justify-center shadow-lg"
      >
        <span className="text-2xl font-bold">🎤</span>
      </button>
      <p className="mt-4 text-lg">Press to Start Speaking</p>
    </div>
  );
};

export default MicControlPage;