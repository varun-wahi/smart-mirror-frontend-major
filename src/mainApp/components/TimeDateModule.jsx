import { useState, useEffect } from "react";

function TimeDateModule() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  return (
    <div className="flex flex-col">
      <div className="text-6xl font-normal tracking-wider">
        {formatTime(currentTime).split(':').slice(0, 2).join(':')}
        <span className="text-gray-400">
          :{formatTime(currentTime).split(':')[2]}
        </span>
      </div>
      <div className="text-lg font-light text-gray-300 mt-2">
        {formatDate(currentTime)}
      </div>
    </div>
  );
};

export default TimeDateModule;