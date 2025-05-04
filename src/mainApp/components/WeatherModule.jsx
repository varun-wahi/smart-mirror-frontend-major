import { useState, useEffect } from "react";
import {
  WiDaySunny,
  WiCloud,
  WiRain,
  WiSnow,
  WiHumidity,
  WiStrongWind,
  WiDayCloudyGusts,
  WiDust,
  WiThunderstorm,
  WiDayHaze,
  WiDayFog
} from "react-icons/wi";

function WeatherModule() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const API_KEY = "bf84dc69cfb303c6ded5e2db4fa80eec"; // Replace with your API key
  const CITY = "Bhopal";

  useEffect(() => {
    async function fetchWeather() {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=metric&appid=${API_KEY}`
        );
        const data = await response.json();
        setWeather(data);

        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&units=metric&appid=${API_KEY}`
        );
        const forecastData = await forecastResponse.json();
        setForecast(forecastData);
      } catch (error) {
        console.error("Error fetching weather data:", error);
      }
    }
    fetchWeather();
  }, []);

  const getWeatherIcon = (main) => {
    switch (main.toLowerCase()) {
      case "clear":
        return <WiDaySunny size={48} color="rgba(255, 255, 255, 0.8)" />;
      case "clouds":
        return <WiCloud size={48} color="rgba(255, 255, 255, 0.8)" />;
      case "rain":
        return <WiRain size={48} color="rgba(255, 255, 255, 0.8)" />;
      case "snow":
        return <WiSnow size={48} color="rgba(255, 255, 255, 0.8)" />;
      case "thunderstorm":
        return <WiThunderstorm size={48} color="rgba(255, 255, 255, 0.8)" />;
      case "drizzle":
        return <WiRain size={48} color="rgba(255, 255, 255, 0.8)" />;
      case "mist":
      case "fog":
        return <WiDayFog size={48} color="rgba(255, 255, 255, 0.8)" />;
      case "haze":
        return <WiDayHaze size={48} color="rgba(255, 255, 255, 0.8)" />;
      case "dust":
      case "sand":
        return <WiDust size={48} color="rgba(255, 255, 255, 0.8)" />;
      case "wind":
        return <WiDayCloudyGusts size={48} color="rgba(255, 255, 255, 0.8)" />;
      default:
        return <WiCloud size={48} color="rgba(255, 255, 255, 0.8)" />;
    }
  };

  const getForecastIcon = (main) => {
    switch (main.toLowerCase()) {
      case "clear":
        return <WiDaySunny size={32} color="rgba(255, 255, 255, 0.7)" />;
      case "clouds":
        return <WiCloud size={32} color="rgba(255, 255, 255, 0.7)" />;
      case "rain":
        return <WiRain size={32} color="rgba(255, 255, 255, 0.7)" />;
      case "snow":
        return <WiSnow size={32} color="rgba(255, 255, 255, 0.7)" />;
      case "thunderstorm":
        return <WiThunderstorm size={32} color="rgba(255, 255, 255, 0.7)" />;
      default:
        return <WiCloud size={32} color="rgba(255, 255, 255, 0.7)" />;
    }
  };

  // Format date to display only day name
  const formatDay = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
    });
  };

  return (
    <div className="text-white p-6">
      {weather ? (
        <div className="flex flex-col items-end">
          {/* City name with elegant styling */}
          <h2 className="text-lg font-extralight tracking-widest mb-2 text-gray-300 uppercase">
            {CITY}
          </h2>
          
          {/* Main Temperature Display */}
          <div className="flex items-center justify-end space-x-4">
            {/* Weather Icon */}
            <div>{getWeatherIcon(weather.weather[0].main)}</div>
  
            {/* Temperature */}
            <div className="text-right">
              <h1 className="text-5xl font-extralight tracking-wide">
                {weather.main.temp.toFixed(1)}°
              </h1>
              <p className="text-lg font-extralight text-gray-400">
                {weather.weather[0].description}
              </p>
            </div>
          </div>
  
          {/* Weather Details with minimal styling */}
          <div className="flex justify-end w-full mt-4 text-base space-x-6 text-gray-300 font-light">
            <div className="flex items-center">
              <WiStrongWind size={22} />
              <p className="ml-1">{weather.wind.speed} m/s</p>
            </div>
            <div className="flex items-center">
              <WiHumidity size={22} />
              <p className="ml-1">{weather.main.humidity}%</p>
            </div>
          </div>
  
          {/* Weather Forecast with sleek design */}
          {forecast && (
            <div className="mt-8 w-full">
              <div className="flex justify-between text-sm">
                {forecast.list
                  .filter((item, index) => index % 8 === 0)
                  .slice(0, 5)
                  .map((day, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center space-y-1 opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <p className="font-light text-gray-400">
                        {formatDay(day.dt_txt)}
                      </p>
                      {getForecastIcon(day.weather[0].main)}
                      <p className="font-extralight">
                        {day.main.temp.toFixed(0)}°
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-lg font-extralight text-center tracking-widest">
          <p>LOADING WEATHER...</p>
        </div>
      )}
    </div>
  );
}

export default WeatherModule;