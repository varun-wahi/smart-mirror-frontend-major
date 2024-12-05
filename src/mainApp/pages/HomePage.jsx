import React from 'react';
import TimeDateModule from '../components/TimeDateModule.jsx'
import WeatherModule from '../components/WeatherModule.jsx'

const HomePage = () => {
  return (
    <div className="min-h-screen bg-black text-white grid grid-rows-[1fr_auto] grid-cols-2 p-10">
      {/* Top Left: TimeDateModule */}
      <div className="self-start justify-self-start m-4">
        <TimeDateModule />
      </div>

      {/* Top Right: WeatherModule */}
      <div className="self-start justify-self-end m-4">
        <WeatherModule />
      </div>

      {/* Footer: Bottom Center */}
      <div className="col-span-2 text-center self-end mt-4">
        <p className="text-lg text-gray-400">
          Made with ❤️ By Varun ,Aditya, Soumyadeep, Vedant
        </p>
      </div>
    </div>
  );
};

export default HomePage;