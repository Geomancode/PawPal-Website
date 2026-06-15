"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  CloudRain, Wind, Thermometer, MapPin, Droplets, Sun,
  CloudSnow, Cloud, CloudLightning, CloudFog,
  Navigation, Dog, RefreshCw,
} from "lucide-react";

/* ── WMO Weather Code → Icon + Label ── */
function getWeatherInfo(code: number): { icon: React.ReactNode; label: string } {
  if (code === 0) return { icon: <Sun className="w-4 h-4 text-paw-warning" />, label: "Clear Sky" };
  if (code <= 3) return { icon: <Cloud className="w-4 h-4 text-white/70" />, label: code === 1 ? "Mainly Clear" : code === 2 ? "Partly Cloudy" : "Overcast" };
  if (code <= 48) return { icon: <CloudFog className="w-4 h-4 text-white/60" />, label: "Foggy" };
  if (code <= 57) return { icon: <CloudRain className="w-4 h-4 text-paw-trust" />, label: "Drizzle" };
  if (code <= 67) return { icon: <CloudRain className="w-4 h-4 text-paw-trust" />, label: "Rain" };
  if (code <= 77) return { icon: <CloudSnow className="w-4 h-4 text-paw-trust" />, label: "Snow" };
  if (code <= 82) return { icon: <CloudRain className="w-4 h-4 text-paw-trust" />, label: "Rain Showers" };
  if (code <= 86) return { icon: <CloudSnow className="w-4 h-4 text-paw-trust" />, label: "Snow Showers" };
  if (code <= 99) return { icon: <CloudLightning className="w-4 h-4 text-paw-warning" />, label: "Thunderstorm" };
  return { icon: <Cloud className="w-4 h-4 text-white/70" />, label: "Unknown" };
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
  const [weatherIssue, setWeatherIssue] = useState(false);
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
    setWeatherIssue(false);
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
    } catch {
      setWeatherIssue(true);
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
      <div className="globe-weather-bar absolute z-40 overflow-hidden text-white/80">
        <div className="flex items-center justify-center gap-2 text-sm">
          {loading && !weatherIssue ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Loading weather...
            </>
          ) : (
            <>
              <Cloud className="w-4 h-4 text-white/70" /> Weather temporarily unavailable
            </>
          )}
        </div>
      </div>
    );
  }

  const weatherInfo = getWeatherInfo(weather.weatherCode);
  const walkAdvice = getWalkAdvice(weather.temp, weather.windSpeed, weather.rainProb, weather.uvIndex, weather.weatherCode);
  const weatherItems = [
    {
      key: "place",
      className: "text-paw-primary",
      icon: <MapPin className="w-4 h-4" aria-hidden="true" />,
      label: weather.city,
      suffix: !weather.isUserLocation ? "MAP" : "",
    },
    {
      key: "condition",
      icon: weatherInfo.icon,
      label: weatherInfo.label,
    },
    {
      key: "temperature",
      icon: <Thermometer className="w-4 h-4 text-paw-success" aria-hidden="true" />,
      label: `${weather.temp}°C`,
      suffix: `feels ${weather.feelsLike}°C`,
    },
    {
      key: "wind",
      icon: <Wind className="w-4 h-4 text-paw-trust" aria-hidden="true" />,
      label: `${weather.windSpeed} km/h`,
    },
    {
      key: "humidity",
      icon: <Droplets className="w-4 h-4 text-paw-trust" aria-hidden="true" />,
      label: `${weather.humidity}%`,
    },
    {
      key: "rain",
      icon: <CloudRain className="w-4 h-4 text-paw-trust" aria-hidden="true" />,
      label: weather.rainProb > 0 ? `${weather.rainProb}% rain` : "No rain",
    },
    {
      key: "uv",
      icon: <Sun className="w-4 h-4 text-paw-warning" aria-hidden="true" />,
      label: `UV ${weather.uvIndex}`,
    },
    {
      key: "advice",
      className: "text-paw-primary/90",
      icon: <Dog className="w-4 h-4 text-paw-primary" aria-hidden="true" />,
      label: `${walkAdvice.emoji} ${walkAdvice.text}`,
    },
  ];

  return (
    <div className="globe-weather-bar absolute z-40 overflow-hidden text-white/90">
      <div className="globe-weather-content flex items-center">
        {/* Recenter button (shows when viewing map-center weather) */}
        {!weather.isUserLocation && (
          <button
            onClick={handleRecenter}
            className="shrink-0 ml-3 mr-1 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paw-primary/90 hover:bg-paw-primary text-white text-[11px] font-bold transition-all z-10 shadow-paw-action"
            title="Back to my location"
          >
            <Navigation className="w-3.5 h-3.5" />
            My Location
          </button>
        )}

        <div className="globe-weather-items">
          {weatherItems.map((item) => (
            <span key={item.key} className={`globe-weather-item ${item.className ?? ""}`.trim()}>
              {item.icon}
              <span className="truncate">{item.label}</span>
              {item.suffix && (
                <span className="globe-weather-suffix">{item.suffix}</span>
              )}
            </span>
          ))}
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
