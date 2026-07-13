"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import PawIcon from "@/components/icons/PawIcon";
import type { MessageKey } from "@/i18n/messages/en";

type GlobeTranslation = (key: MessageKey) => string;

function formatMessage(
  message: string,
  values: Record<string, string | number>,
): string {
  return Object.entries(values).reduce(
    (formatted, [key, value]) => formatted.replaceAll(`{${key}}`, String(value)),
    message,
  );
}

/* ── WMO Weather Code → Icon + Label ── */
function getWeatherInfo(code: number, t: GlobeTranslation): { icon: React.ReactNode; label: string } {
  if (code === 0) return { icon: <PawIcon name="sun" className="w-4 h-4 text-paw-warning" />, label: t("globeWeatherClearSky") };
  if (code <= 3) return { icon: <PawIcon name="cloud" className="w-4 h-4 text-paw-page/70" />, label: code === 1 ? t("globeWeatherMainlyClear") : code === 2 ? t("globeWeatherPartlyCloudy") : t("globeWeatherOvercast") };
  if (code <= 48) return { icon: <PawIcon name="fog" className="w-4 h-4 text-paw-page/60" />, label: t("globeWeatherFoggy") };
  if (code <= 57) return { icon: <PawIcon name="rain" className="w-4 h-4 text-paw-trust" />, label: t("globeWeatherDrizzle") };
  if (code <= 67) return { icon: <PawIcon name="rain" className="w-4 h-4 text-paw-trust" />, label: t("globeWeatherRain") };
  if (code <= 77) return { icon: <PawIcon name="snow" className="w-4 h-4 text-paw-trust" />, label: t("globeWeatherSnow") };
  if (code <= 82) return { icon: <PawIcon name="rain" className="w-4 h-4 text-paw-trust" />, label: t("globeWeatherRainShowers") };
  if (code <= 86) return { icon: <PawIcon name="snow" className="w-4 h-4 text-paw-trust" />, label: t("globeWeatherSnowShowers") };
  if (code <= 99) return { icon: <PawIcon name="storm" className="w-4 h-4 text-paw-warning" />, label: t("globeWeatherThunderstorm") };
  return { icon: <PawIcon name="cloud" className="w-4 h-4 text-paw-page/70" />, label: t("globeWeatherUnknown") };
}

/* ── Dog Walk Advice ── */
function getWalkAdvice(temp: number, windSpeed: number, rainProb: number, uvIndex: number, weatherCode: number, t: GlobeTranslation): { emoji: string; text: string } {
  if (weatherCode >= 95) return { emoji: "⛈️", text: t("globeWalkAdviceThunderstorms") };
  if (weatherCode >= 71 && weatherCode <= 77) return { emoji: "❄️", text: t("globeWalkAdviceSnow") };
  if (temp < 0) return { emoji: "🥶", text: t("globeWalkAdviceFreezing") };
  if (temp > 35) return { emoji: "🔥", text: t("globeWalkAdviceExtremeHeat") };
  if (temp > 28) return { emoji: "☀️", text: t("globeWalkAdviceHotPavement") };
  if (rainProb > 70) return { emoji: "🌧️", text: t("globeWalkAdviceHeavyRain") };
  if (windSpeed > 50) return { emoji: "💨", text: t("globeWalkAdviceWind") };
  if (uvIndex >= 8) return { emoji: "🧴", text: t("globeWalkAdviceUv") };
  if (rainProb > 40) return { emoji: "🌤️", text: t("globeWalkAdvicePossibleRain") };
  if (temp >= 15 && temp <= 25 && windSpeed < 20 && rainProb < 30) return { emoji: "🐕", text: t("globeWalkAdvicePerfect") };
  if (temp >= 8 && temp <= 15) return { emoji: "🧥", text: t("globeWalkAdviceCool") };
  return { emoji: "👍", text: t("globeWalkAdviceDecent") };
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
  t: GlobeTranslation;
}

/* ── Default location: Ghent, Belgium ── */
const GHENT = { lat: 51.0543, lng: 3.7174 };

/* ── Auto-refresh interval: 15 minutes ── */
const REFRESH_MS = 15 * 60 * 1000;

/* ── Debounce delay for map drag: 800ms ── */
const DRAG_DEBOUNCE_MS = 800;

export default function WeatherTicker({ mapCenter, onRecenterRequest, t }: WeatherTickerProps) {
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
        t("globeWeatherUnknownArea");

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
  }, [weather, t]);

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
      <div className="globe-weather-bar absolute z-40 text-paw-page/80">
        <div className="flex items-center justify-center gap-2 text-sm">
          {loading && !weatherIssue ? (
            <>
              <PawIcon name="refresh" className="w-4 h-4 animate-spin" /> {t("globeWeatherLoading")}
            </>
          ) : (
            <>
              <PawIcon name="cloud" className="w-4 h-4 text-paw-page/70" /> {t("globeWeatherUnavailable")}
            </>
          )}
        </div>
      </div>
    );
  }

  const weatherInfo = getWeatherInfo(weather.weatherCode, t);
  const walkAdvice = getWalkAdvice(weather.temp, weather.windSpeed, weather.rainProb, weather.uvIndex, weather.weatherCode, t);
  const weatherItems = [
    {
      key: "place",
      className: "globe-weather-item-place",
      icon: <PawIcon name="location" className="w-4 h-4" aria-hidden="true" />,
      label: weather.city,
      suffix: !weather.isUserLocation ? t("globeWeatherMapSuffix") : "",
    },
    {
      key: "condition",
      icon: weatherInfo.icon,
      label: weatherInfo.label,
    },
    {
      key: "temperature",
      icon: <PawIcon name="temperature" className="w-4 h-4 text-paw-success" aria-hidden="true" />,
      label: `${weather.temp}°C`,
      suffix: formatMessage(t("globeWeatherFeels"), { temperature: weather.feelsLike }),
    },
    {
      key: "wind",
      icon: <PawIcon name="wind" className="w-4 h-4 text-paw-trust" aria-hidden="true" />,
      label: formatMessage(t("globeWeatherWindSpeed"), { speed: weather.windSpeed }),
    },
    {
      key: "humidity",
      icon: <PawIcon name="humidity" className="w-4 h-4 text-paw-trust" aria-hidden="true" />,
      label: `${weather.humidity}%`,
    },
    {
      key: "rain",
      icon: <PawIcon name="rain" className="w-4 h-4 text-paw-trust" aria-hidden="true" />,
      label: weather.rainProb > 0
        ? formatMessage(t("globeWeatherRainChance"), { chance: weather.rainProb })
        : t("globeWeatherNoRain"),
    },
    {
      key: "uv",
      icon: <PawIcon name="sun" className="w-4 h-4 text-paw-warning" aria-hidden="true" />,
      label: formatMessage(t("globeWeatherUvIndex"), { index: weather.uvIndex }),
    },
    {
      key: "advice",
      className: "globe-weather-item-advice",
      icon: <PawIcon name="dog" className="w-4 h-4 text-paw-primary" aria-hidden="true" />,
      label: `${walkAdvice.emoji} ${walkAdvice.text}`,
    },
  ];

  return (
    <div className="globe-weather-bar absolute z-40 text-paw-page/90">
      <div className="globe-weather-content flex items-center">
        {/* Recenter button (shows when viewing map-center weather) */}
        {!weather.isUserLocation && (
          <button
            onClick={handleRecenter}
            className="shrink-0 ml-3 mr-1 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paw-primary/90 hover:bg-paw-primary text-paw-accent-ink text-paw-type-caption font-bold transition-all z-10 shadow-paw-action"
            title={t("globeWeatherBackToLocation")}
          >
            <PawIcon name="navigate" className="w-3.5 h-3.5" />
            {t("globeWeatherMyLocation")}
          </button>
        )}

        <div className="globe-weather-items">
          {weatherItems.map((item) => (
            <span key={item.key} className={`globe-weather-item ${item.className ?? ""}`.trim()}>
              {item.icon}
              <span className="globe-weather-label">{item.label}</span>
              {item.suffix && (
                <span className="globe-weather-suffix">{item.suffix}</span>
              )}
            </span>
          ))}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="shrink-0 mr-3">
            <PawIcon name="refresh" className="w-4 h-4 text-paw-page/40 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
