import { useState, useEffect } from "react";

function TimeDateModule() {
  const [time, setTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format time as "4:31"
  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Format date as "Friday, June 1"
  const formatDate = (date) =>
    date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="text-left">
      <h2 className="text-6xl font-bold">{formatTime(time)}</h2>
      <p className="text-2xl text-gray-400">{formatDate(time)}</p>
    </div>
  );
}

export default TimeDateModule;