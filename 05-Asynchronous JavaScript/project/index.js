// Module 05 Mini Project — Async Weather App
// Fetches live weather from Open-Meteo (no API key needed)
//
// Usage:
//   node index.js                        → weather for a default set of cities
//   node index.js London                 → single city
//   node index.js "New York" Tokyo Paris → multiple cities in parallel

import { getWeatherForCity } from "./api.js";
import { printWeather, printLoading, printDone, printError } from "./display.js";

const DEFAULT_CITIES = ["London", "Tokyo", "New York"];

async function fetchWithTimeout(city, ms = 8000) {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), ms);

  try {
    printLoading(city);
    const result = await getWeatherForCity(city, controller.signal);
    printDone();
    return { city, result, ok: true };
  } catch (err) {
    printDone();
    return { city, result: null, ok: false, error: err };
  } finally {
    clearTimeout(timer);
  }
}

async function run() {
  // Cities from CLI args or defaults
  const args   = process.argv.slice(2);
  const cities = args.length > 0 ? args : DEFAULT_CITIES;

  console.log();

  if (cities.length === 1) {
    // Single city — simple sequential
    const { result, ok, error } = await fetchWithTimeout(cities[0]);
    if (ok) printWeather(result);
    else printError(error);

  } else {
    // Multiple cities — fetch all in parallel, report each as it completes
    const promises = cities.map(city => fetchWithTimeout(city));
    const results  = await Promise.allSettled(promises);

    for (const settled of results) {
      if (settled.status === "rejected") {
        printError(settled.reason);
        continue;
      }
      const { ok, result, error } = settled.value;
      if (ok) printWeather(result);
      else printError(error);
    }
  }
}

run().catch(err => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
