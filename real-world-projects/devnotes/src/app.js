import http   from "http";
import crypto from "crypto";
import { config } from "./config.js";

// ── Utilities ────────────────────────────────────────

export function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => {
      data += chunk;
      if (data.length > 500_000) req.destroy(new Error("Payload too large"));
    });
    req.on("end",   () => {
      try   { resolve(data ? JSON.parse(data) : {}); }
      catch { reject(Object.assign(new Error("Invalid JSON"), { status: 400 })); }
    });
    req.on("error", reject);
  });
}

export function send(res, status, data) {
  const body = JSON.stringify({ ok: status < 400, ...data }, null, config.isDev ? 2 : 0);
  res.writeHead(status, {
    "Content-Type":                "application/json",
    "Content-Length":              Buffer.byteLength(body),
    "X-Request-ID":                res._reqId ?? "",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

function applyCORS(res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age",       "86400");
}

// ── Route handler ─────────────────────────────────────

export async function handleRequest(req, res) {
  res._reqId = crypto.randomUUID().slice(0, 8);
  applyCORS(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204); res.end(); return;
  }

  const url    = new URL(req.url, "http://localhost");
  const path   = url.pathname.replace(/\/+$/, "") || "/";
  const method = req.method;

  // Request log
  console.log(`[${res._reqId}] ${method} ${path}`);

  try {
    // ── Health ──────────────────────────────────────
    if (path === "/health" && method === "GET") {
      return send(res, 200, {
        data: {
          status:  "ok",
          version: "0.1.0",
          env:     config.env,
          uptime:  Math.round(process.uptime()),
        },
      });
    }

    // ── Static files ─────────────────────────────────
    if (path === "/" && method === "GET") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("DevNotes API — see /health");
      return;
    }

    // ── 404 ──────────────────────────────────────────
    send(res, 404, { error: `Cannot ${method} ${path}` });

  } catch (err) {
    const status = err.status ?? 500;
    if (status >= 500) console.error(`[${res._reqId}] Error:`, err.message, config.isDev ? err.stack : "");
    send(res, status, {
      error: config.isProd && status >= 500 ? "Internal server error" : err.message,
    });
  }
}
