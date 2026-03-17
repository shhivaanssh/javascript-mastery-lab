import http from "http";
import { handleRequest } from "./app.js";
import { config } from "./config.js";

// Import db to run migrations on startup
import "./db.js";

const server = http.createServer(handleRequest);

server.on("error", err => {
  if (err.code === "EADDRINUSE") {
    console.error(`✗  Port ${config.port} is already in use`);
    process.exit(1);
  }
  throw err;
});

server.listen(config.port, () => {
  console.log(`
  ██████╗ ███████╗██╗   ██╗███╗   ██╗ ██████╗ ████████╗███████╗███████╗
  ██╔══██╗██╔════╝██║   ██║████╗  ██║██╔═══██╗╚══██╔══╝██╔════╝██╔════╝
  ██║  ██║█████╗  ██║   ██║██╔██╗ ██║██║   ██║   ██║   █████╗  ███████╗
  ██║  ██║██╔══╝  ╚██╗ ██╔╝██║╚██╗██║██║   ██║   ██║   ██╔══╝  ╚════██║
  ██████╔╝███████╗ ╚████╔╝ ██║ ╚████║╚██████╔╝   ██║   ███████╗███████║
  ╚═════╝ ╚══════╝  ╚═══╝  ╚═╝  ╚═══╝ ╚═════╝    ╚═╝   ╚══════╝╚══════╝

  http://localhost:${config.port}   [${config.env}]
  DB: ${config.dbPath}

  GET  /health
`);
});

const shutdown = signal => () => {
  console.log(`\n  ${signal} received — shutting down...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000);
};

process.on("SIGTERM", shutdown("SIGTERM"));
process.on("SIGINT",  shutdown("SIGINT"));
process.on("uncaughtException",  err => { console.error("Uncaught:", err);  process.exit(1); });
process.on("unhandledRejection", r   => { console.error("Unhandled:", r);   process.exit(1); });
