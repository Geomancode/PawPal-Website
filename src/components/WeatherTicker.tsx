"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  CloudRain, Wind, Thermometer, MapPin, Droplets, Sun,
  CloudSnow, Cloud, CloudLightning, CloudFog,
  Navigation, Dog, RefreshCw,
} from "lucide-react";

/* ── WMO Weather Code → Icon + Label ── */
function getWeatherInfo(code: number): { icon: React.ReactNode; label: string } {
  if (code === 0) return { icon: <Sun className="w-4 h-4 text-yellow-400" />, label: "Clear Sky" };
  if (code <= 3) return { icon: <Cloud className="w-4 h-4 text-gray-300" />, label: code === 1 ? "Mainly Clear" : code === 2 ? "Partly Cloudy" : "Overcast" };
  if (code <= 48) return { icon: <CloudFog className="w-4 h-4 text-gray-400" />, label: "Foggy" };
  if (code <= 57) return { icon: <CloudRain className="w-4 h-4 text-blue-300" />, label: "Drizzle" };
  if (code <= 67) return { icon: <CloudRain className="w-4 h-4 text-blue-400" />, label: "Rain" };
  if (code <= 77) return { icon: <CloudSnow className="w-4 h-4 text-blue-200" />, label: "Snow" };
  if (code <= 82) return { icon: <CloudRain className="w-4 h-4 text-blue-500" />, label: "Rain Showers" };
  if (code <= 86) return { icon: <CloudSnow className="w-4 h-4 text-blue-300" />, label: "Snow Showers" };
  if (code <= 99) return { icon: <CloudLightning className="w-4 h-4 text-yellow-300" />, label: "Thunderstorm" };
  return { icon: <Cloud className="w-4 h-4 text-gray-300" />, label: "Unknown" };
}

/* ── Dog Walk Advice ── */
function getWalkAdvice(temp: number, windSpeed: number, rainProb: number, uvIndex: number, weatherCode: number): { emoji: string; text: string } {
  if (weatherCode >= 95) return { emoji: "⛈️", text: "Stay indoors — thunderstorms!" };
  if (weatherCode >= 71 && weatherCode <= 77) return { emoji: "❄️", text: "Cold & snowy — short walks only, paw protection recommended" };
  if (temp < 0) return { emoji: "🥶", text: "Below freezing — protect paws from ice and salt" };
  if (temp > 35) return { emoji: "🔥", text: "Too hot! Risk of burnt paws — walk early morning or late evening" };
  if (temp > 28) return { emoji: "☀️", text: "Hot pavement alert — walk in shaded areas, bring water" };
  if (rainProb > 70) return { emoji: "🌧️", text: "High chance of rain — bring a raincoat for your pup" };
  if (windSpeed > 50) return { emoji: "💨", text: "Very windy — keep small dogs on short leash" };
  if (uvIndex >= 8) return { emoji: "🧴", text: "High UV — avoid midday walks, light-skinned dogs need protection" };
  if (rainProb > 40) return { emoji: "🌤️", text: "Might rain later — good time for a quick walk now!" };
  if (temp >= 15 && temp <= 25 && windSpeed < 20 && rainProb < 30) return { emoji: "🐕", text: "Perfect weather for a long walk! Enjoy!" };
  if (temp >= 8 && temp <= 15) return { emoji: "🧥", text: "Cool & pleasant — great walking weather" };
  return { emoji: "👍", text: "Decent conditions — enjoy your walk!" };
}

/* ── Types ── */
interface WeatherData {
  temp: number;
  feelsLike: number;
  windSpeed: number;
  humidity: number;
  rainProb: number;
  uvIndex: number;
  weatherCode: number;
  city: string;
  isUserLocation: boolean;
}

interface WeatherTickerProps {
  /** Coordinates from map center (when user drags the globe) */
  mapCenter?: { lat: number; lng: number } | null;
  /** Called when user clicks "back to my location" */
  onRecenterRequest?: () => void;
}

/* ── Default location: Ghent, Belgium ── */
const GHENT = { lat: 51.0543, lng: 3.7174 };

/* ── Auto-refresh interval: 15 minutes ── */
const REFRESH_MS = 15 * 60 * 1000;

/* ── Debounce delay for map drag: 800ms ── */
const DRAG_DEBOUNCE_MS = 800;

export default function WeatherTicker({ mapCenter, onRecenterRequest }: WeatherTickerProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedRef = useRef<string>("");

  /* ── Fetch weather data ── */
  const fetchWeather = useCallback(async (lat: number, lon: number, isUser: boolean) => {
    const coordKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    // Skip if same location was just fetched
    if (coordKey === lastFetchedRef.current && weather) return;
    lastFetchedRef.current = coordKey;

    setLoading(true);
    try {
      // Parallel fetch: geocoding + weather
      const [geoRes, weatherRes] = await Promise.all([
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`),
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,wind_speed_10m,relative_humidity_2m,weather_code&daily=precipitation_probability_max,uv_index_max&timezone=auto`),
      ]);

      const [geoData, weatherData] = await Promise.all([geoRes.json(), weatherRes.json()]);

      const city =
        geoData.address?.city ||
        geoData.address?.town ||
        geoData.address?.village ||
        geoData.address?.state ||
        geoData.address?.country ||
        "Unknown Area";

      setWeather({
        temp: Math.round(weatherData.current?.temperature_2m ?? 0),
        feelsLike: Math.round(weatherData.current?.apparent_temperature ?? 0),
        windSpeed: Math.round(weatherData.current?.wind_speed_10m ?? 0),
        humidity: weatherData.current?.relative_humidity_2m ?? 0,
        weatherCode: weatherData.current?.weather_code ?? 0,
        rainProb: weatherData.daily?.precipitation_probability_max?.[0] ?? 0,
        uvIndex: Math.round(weatherData.daily?.uv_index_max?.[0] ?? 0),
        city,
        isUserLocation: isUser,
      });
    } catch (e) {
      console.error("Weather fetch error", e);
    } finally {
      setLoading(false);
    }
  }, [weather]);

  /* ── Initial load: get user location ── */
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          fetchWeather(coords.lat, coords.lng, true);
        },
        () => {
          // Fallback to Ghent
          setUserCoords(GHENT);
          fetchWeather(GHENT.lat, GHENT.lng, true);
        },
        { timeout: 8000 }
      );
    } else {
      setUserCoords(GHENT);
      fetchWeather(GHENT.lat, GHENT.lng, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Auto-refresh every 15 minutes ── */
  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      // Refresh for whatever location is currently displayed
      if (mapCenter) {
        fetchWeather(mapCenter.lat, mapCenter.lng, false);
      } else if (userCoords) {
        fetchWeather(userCoords.lat, userCoords.lng, true);
      }
    }, REFRESH_MS);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [mapCenter, userCoords, fetchWeather]);

  /* ── React to map center changes (debounced) ── */
  useEffect(() => {
    if (!mapCenter) return;

    // Debounce: don't fetch on every single pixel of drag
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchWeather(mapCenter.lat, mapCenter.lng, false);
    }, DRAG_DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [mapCenter, fetchWeather]);

  /* ── Handle recenter to user location ── */
  const handleRecenter = () => {
    if (userCoords) {
      lastFetchedRef.current = ""; // Force re-fetch
      fetchWeather(userCoords.lat, userCoords.lng, true);
    }
    onRecenterRequest?.();
  };

  if (!weather) {
    return (
      <div className="absolute top-[80px] left-0 w-full z-40 bg-black/40 backdrop-blur-md border-b border-white/10 text-white/70 overflow-hidden py-3">
        <div className="flex items-center justify-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading weather…
        </div>
      </div>
    );
  }

  const weatherInfo = getWeatherInfo(weather.weatherCode);
  const walkAdvice = getWalkAdvice(weather.temp, weather.windSpeed, weather.rainProb, weather.uvIndex, weather.weatherCode);

  return (
    <div className="absolute top-[80px] left-0 w-full z-40 bg-black/50 backdrop-blur-md border-b border-white/10 text-white/90 overflow-hidden py-2.5">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes weather-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .weather-marquee-track {
          animation: weather-marquee 40s linear infinite;
          width: fit-content;
        }
        .weather-marquee-track:hover {
          animation-play-state: paused;
        }
      `}} />

      <div className="flex items-center">
        {/* Recenter button (shows when viewing map-center weather) */}
        {!weather.isUserLocation && (
          <button
            onClick={handleRecenter}
            className="shrink-0 ml-3 mr-1 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/90 hover:bg-amber-500 text-white text-[11px] font-bold transition-all z-10 shadow-lg"
            title="Back to my location"
          >
            <Navigation className="w-3.5 h-3.5" />
            My Location
          </button>
        )}

        {/* Scrolling weather ticker */}
        <div className="flex-1 overflow-hidden">
          <div className="weather-marquee-track flex whitespace-nowrap items-center">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-8 shrink-0 px-6 font-medium tracking-wide text-sm">
                {/* Location */}
                <span className="flex items-center gap-1.5 text-amber-300">
                  <MapPin className="w-4 h-4" />
                  {weather.city}
                  {!weather.isUserLocation && (
                    <span className="text-[9px] bg-white/15 px-1.5 py-0.5 rounded-full ml-1 text-white/60">MAP</span>
                  )}
                </span>

                {/* Weather condition */}
                <span className="flex items-center gap-1.5">
                  {weatherInfo.icon} {weatherInfo.label}
                </span>

                {/* Temperature */}
                <span className="flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-emerald-400" />
                  {weather.temp}°C
                  <span className="text-white/40 text-xs">(feels {weather.feelsLike}°C)</span>
                </span>

                {/* Wind */}
                <span className="flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-blue-400" /> {weather.windSpeed} km/h
                </span>

                {/* Humidity */}
                <span className="flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-cyan-400" /> {weather.humidity}%
                </span>

                {/* Rain Probability */}
                <span className="flex items-center gap-1.5">
                  <CloudRain className="w-4 h-4 text-blue-300" />
                  {weather.rainProb > 0 ? `${weather.rainProb}% rain` : "No rain"}
                </span>

                {/* UV Index */}
                <span className="flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-yellow-300" /> UV {weather.uvIndex}
                </span>

                {/* Dog Walk Advice */}
                <span className="flex items-center gap-1.5 text-amber-200/90">
                  <Dog className="w-4 h-4 text-amber-400" />
                  {walkAdvice.emoji} {walkAdvice.text}
                </span>

                {/* Separator */}
                <span className="text-white/20 text-lg">•</span>
              </div>
            ))}
          </div>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="shrink-0 mr-3">
            <RefreshCw className="w-4 h-4 text-white/40 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
