import React from 'react';
import TimeDateModule from '../components/TimeDateModule.jsx';
import WeatherModule from '../components/WeatherModule.jsx';
import IndianHolidaysCalendar from '../components/IndianHolidaysCalender.jsx';
import NewsFeedModule from '../components/NewsFeedModule.jsx';

const HomePage = () => {
  return (
    <div className="min-h-screen max-h-screen bg-black text-white p-6 flex flex-col justify-between overflow-hidden">
      
      {/* Top Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Time + Holidays */}
        <div className="flex flex-col space-y-6 max-w-sm w-full">
          <TimeDateModule />
          <IndianHolidaysCalendar />
        </div>

        {/* Right: Weather */}
        <div className="self-start justify-self-end">
          <WeatherModule />
        </div>
      </div>

{/* Bottom Section */}
<div className="flex flex-col items-center space-y-6 mt-6">
  <div className="w-full max-w-2xl h-48 overflow-y-auto">
    <NewsFeedModule />
  </div>
  <div className="text-sm text-gray-500 mt-4">
    Made with ❤️ by Varun, Aditya, Soumyadeep, Vedant
  </div>
</div>
</div>

  );
};

export default HomePage;