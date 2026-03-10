const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function windDirection(degrees) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(degrees / 45) % 8];
}

function weatherIcon(condition, isDay = true) {
  const c = condition.toLowerCase();
  if (c.includes("clear"))        return isDay ? "☀️ " : "🌙";
  if (c.includes("mainly clear")) return isDay ? "🌤️ " : "🌙";
  if (c.includes("partly"))       return "⛅";
  if (c.includes("overcast"))     return "☁️ ";
  if (c.includes("fog"))          return "🌫️ ";
  if (c.includes("drizzle"))      return "🌦️ ";
  if (c.includes("heavy rain"))   return "🌧️ ";
  if (c.includes("rain"))         return "🌧️ ";
  if (c.includes("snow"))         return "❄️ ";
  if (c.includes("thunder"))      return "⛈️ ";
  if (c.includes("shower"))       return "🌦️ ";
  return "🌡️ ";
}

function formatDate(dateStr) {
  const date = new Date(dateStr + "T12:00:00");
  return `${DAYS[date.getDay()]} ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function bar(value, max, width = 10) {
  const filled = Math.round((value / max) * width);
  return "▓".repeat(Math.max(0, filled)) + "░".repeat(Math.max(0, width - filled));
}

function divider(char = "─", len = 52) {
  return char.repeat(len);
}

export function printWeather({ location, weather }) {
  const { current, forecast } = weather;
  const { name, country }     = location;
  const unit = current.units.temp;
  const windUnit = current.units.wind;

  console.log();
  console.log("═".repeat(52));
  console.log(`  ${weatherIcon(current.condition, current.isDay)}  ${name}, ${country}`);
  console.log("═".repeat(52));

  console.log();
  console.log(`  ${current.condition}`);
  console.log(`  Temperature   : ${current.temp}${unit}  (feels like ${current.feelsLike}${unit})`);
  console.log(`  Humidity      : ${current.humidity}%  ${bar(current.humidity, 100)}`);
  console.log(`  Wind          : ${current.windSpeed} ${windUnit} ${windDirection(current.windDir)}`);

  console.log();
  console.log(divider());
  console.log("  5-DAY FORECAST");
  console.log(divider());

  const maxHigh = Math.max(...forecast.map(d => d.high));

  forecast.forEach((day, i) => {
    const label     = i === 0 ? "Today    " : formatDate(day.date).padEnd(9);
    const icon      = weatherIcon(day.condition);
    const tempRange = `${String(Math.round(day.high)).padStart(3)}${unit} / ${String(Math.round(day.low)).padStart(3)}${unit}`;
    const tempBar   = bar(day.high, maxHigh, 8);

    console.log(`  ${label}  ${icon}  ${tempRange}  ${tempBar}  ${day.condition}`);
  });

  console.log();
  console.log(divider());
  console.log("  RAIN & WIND (5-day)");
  console.log(divider());

  forecast.forEach((day, i) => {
    const label = i === 0 ? "Today    " : formatDate(day.date).padEnd(9);
    const rain  = `Rain: ${String(day.rain.toFixed(1)).padStart(5)}mm`;
    const wind  = `Wind: ${String(Math.round(day.wind)).padStart(3)} ${windUnit}`;
    console.log(`  ${label}  ${rain}   ${wind}`);
  });

  console.log();
  console.log("═".repeat(52));
  console.log(`  Data: open-meteo.com  |  ${new Date().toLocaleTimeString()}`);
  console.log("═".repeat(52));
  console.log();
}

export function printLoading(city) {
  process.stdout.write(`  Fetching weather for "${city}"...`);
}

export function printDone() {
  process.stdout.write(" done\n");
}

export function printError(err) {
  console.error("\n  Error:", err.message);
}
