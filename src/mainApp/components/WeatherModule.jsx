import { useState, useEffect } from "react";
import {
  WiDaySunny,
  WiCloud,
  WiRain,
  WiSnow,
  WiHumidity,
  WiStrongWind,
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
        return <WiDaySunny size={48} color="gold" />;
      case "clouds":
        return <WiCloud size={48} color="gray" />;
      case "rain":
        return <WiRain size={48} color="blue" />;
      case "snow":
        return <WiSnow size={48} color="lightblue" />;
      default:
        return <WiCloud size={48} color="gray" />;
    }
  };

  return (
    <div className="text-white bg-black p-6 rounded-lg">
      {weather ? (
        <div className="flex flex-col items-end">
          {/* Main Temperature Display */}
          <div className="flex items-center justify-end space-x-4">
            {/* Weather Icon */}
            <div>{getWeatherIcon(weather.weather[0].main)}</div>
  
            {/* Temperature and Feels Like */}
            <div className="text-right">
              <h1 className="text-6xl font-bold">{weather.main.temp.toFixed(1)}°C</h1>
              <p className="text-xl text-gray-400">Feels like {weather.main.feels_like.toFixed(1)}°C</p>
            </div>
          </div>
  
          {/* Additional Weather Details */}
          <div className="flex justify-end w-full mt-4 text-lg space-x-6">
            <div className="flex items-center">
              <WiStrongWind size={24} />
              <p className="ml-2">{weather.wind.speed} m/s</p>
            </div>
            <div className="flex items-center">
              <WiHumidity size={24} color="blue" />
              <p className="ml-2">{weather.main.humidity}% Humidity</p>
            </div>
          </div>
  
          {/* Weather Forecast */}
          {forecast && (
            <div className="mt-6 w-full text-right">
              <h2 className="text-lg font-semibold mb-2">
                Weather Forecast: {CITY}
              </h2>
              <div className="grid grid-cols-5 gap-2 text-sm">
                {forecast.list.slice(0, 5).map((day, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-end space-y-2"
                  >
                    <p className="font-medium">
                      {new Date(day.dt_txt).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </p>
                    {getWeatherIcon(day.weather[0].main)}
                    <p>
                      {day.main.temp_max.toFixed(1)}° /{" "}
                      {day.main.temp_min.toFixed(1)}°
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-lg text-center">Loading weather...</p>
      )}
    </div>
  );
}

export default WeatherModule;