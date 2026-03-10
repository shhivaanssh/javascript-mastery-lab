// Uses Open-Meteo — completely free, no API key required
// Docs: https://open-meteo.com/en/docs
// Also uses Open-Meteo Geocoding API to convert city names to coordinates

const GEO_URL     = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

// WMO weather code descriptions
const WMO_CODES = {
  0:  "Clear sky",
  1:  "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog",          48: "Icy fog",
  51: "Light drizzle", 53: "Drizzle",     55: "Heavy drizzle",
  61: "Light rain",   63: "Rain",         65: "Heavy rain",
  71: "Light snow",   73: "Snow",         75: "Heavy snow",
  80: "Rain showers", 81: "Showers",      82: "Heavy showers",
  95: "Thunderstorm", 99: "Thunderstorm with hail",
};

async function fetchJSON(url, signal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function geocode(city, signal) {
  const url  = `${GEO_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const data = await fetchJSON(url, signal);

  if (!data.results?.length) {
    throw new Error(`City not found: "${city}"`);
  }

  const { name, country, latitude, longitude, timezone } = data.results[0];
  return { name, country, latitude, longitude, timezone };
}

export async function fetchWeather(lat, lon, timezone, signal) {
  const params = new URLSearchParams({
    latitude:              lat,
    longitude:             lon,
    timezone,
    current:               [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "wind_speed_10m",
      "wind_direction_10m",
      "weather_code",
      "is_day",
    ].join(","),
    daily: [
      "temperature_2m_max",
      "temperature_2m_min",
      "weather_code",
      "precipitation_sum",
      "wind_speed_10m_max",
    ].join(","),
    forecast_days: 5,
    wind_speed_unit: "mph",
  });

  const data = await fetchJSON(`${WEATHER_URL}?${params}`, signal);

  return {
    current: {
      temp:        data.current.temperature_2m,
      feelsLike:   data.current.apparent_temperature,
      humidity:    data.current.relative_humidity_2m,
      windSpeed:   data.current.wind_speed_10m,
      windDir:     data.current.wind_direction_10m,
      condition:   WMO_CODES[data.current.weather_code] ?? "Unknown",
      isDay:       data.current.is_day === 1,
      units: {
        temp:  data.current_units.temperature_2m,
        wind:  data.current_units.wind_speed_10m,
      },
    },
    forecast: data.daily.time.map((date, i) => ({
      date,
      high:      data.daily.temperature_2m_max[i],
      low:       data.daily.temperature_2m_min[i],
      condition: WMO_CODES[data.daily.weather_code[i]] ?? "Unknown",
      rain:      data.daily.precipitation_sum[i],
      wind:      data.daily.wind_speed_10m_max[i],
    })),
  };
}

export async function getWeatherForCity(city, signal) {
  const location = await geocode(city, signal);
  const weather  = await fetchWeather(
    location.latitude,
    location.longitude,
    location.timezone,
    signal
  );
  return { location, weather };
}
