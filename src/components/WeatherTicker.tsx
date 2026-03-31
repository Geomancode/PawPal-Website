"use client";

import { useEffect, useState } from "react";
import { CloudRain, Wind, Thermometer, MapPin } from "lucide-react";

interface WeatherData {
  temp: number;
  windSpeed: number;
  rainProb: number;
  city: string;
}

export default function WeatherTicker() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    async function fetchWeather(lat: number, lon: number) {
      try {
        // Reverse Geocoding for City
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const geoData = await geoRes.json();
        const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.country || "Local Area";

        // Open-Meteo current & daily forecast
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m&daily=precipitation_probability_max&timezone=auto`);
        const weatherData = await weatherRes.json();
        
        setWeather({
          temp: weatherData.current?.temperature_2m || 0,
          windSpeed: weatherData.current?.wind_speed_10m || 0,
          rainProb: weatherData.daily?.precipitation_probability_max?.[0] || 0,
          city
        });
      } catch (e) {
        console.error("Weather fetch error", e);
      }
    }

    // Default Fallback
    const defaultLat = 51.5074;
    const defaultLon = -0.1278;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(defaultLat, defaultLon),
        { timeout: 5000 }
      );
    } else {
      fetchWeather(defaultLat, defaultLon);
    }
  }, []);

  if (!weather) return null;

  return (
    <div className="absolute top-[80px] left-0 w-full z-40 bg-black/40 backdrop-blur-md border-b border-white/10 text-white/90 overflow-hidden py-3">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
          width: fit-content;
        }
      `}} />
      <div className="animate-marquee flex whitespace-nowrap items-center">
        {/* We duplicate the info block to ensure seamless looping */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center space-x-12 shrink-0 px-6 font-medium tracking-wide">
            <span className="flex items-center gap-2 text-amber-300">
              <MapPin className="w-4 h-4" /> {weather.city}
            </span>
            <span className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-emerald-400" /> {weather.temp}°C
            </span>
            <span className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-blue-400" /> {weather.windSpeed} km/h
            </span>
            <span className="flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-gray-300" /> 
              {weather.rainProb > 0 ? `Rain Prob: ${weather.rainProb}%` : 'No Rain Expected'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
