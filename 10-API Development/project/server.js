import http from "http";
import { handleRequest } from "./app.js";
import { config } from "./config.js";

const server = http.createServer(handleRequest);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${config.port} is already in use`);
    process.exit(1);
  }
  throw err;
});

server.listen(config.port, () => {
  console.log(`
┌────────────────────────────────────────────┐
│          Habit Tracker API  v1.0           │
├────────────────────────────────────────────┤
│  http://localhost:${String(config.port).padEnd(25)}│
│  ENV: ${config.env.padEnd(36)}│
│  DB:  ${config.dbPath.padEnd(36)}│
└────────────────────────────────────────────┘

  POST  /api/v1/auth/register
  POST  /api/v1/auth/login
  GET   /api/v1/me

  GET   /api/v1/habits
  POST  /api/v1/habits
  PUT   /api/v1/habits/:id
  DELETE /api/v1/habits/:id

  POST  /api/v1/habits/:id/complete
  DELETE /api/v1/habits/:id/complete
  GET   /api/v1/habits/:id/completions

  GET   /api/v1/stats?days=30
`);
});

// Graceful shutdown
const shutdown = () => {
  console.log("\nShutting down...");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT",  shutdown);
process.on("uncaughtException",  (err) => { console.error("Uncaught:", err); shutdown(); });
process.on("unhandledRejection", (r)   => { console.error("Unhandled:", r);  shutdown(); });
