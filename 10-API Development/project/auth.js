import crypto from "crypto";
import { config } from "./config.js";

// ── Password hashing with scrypt ──

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await new Promise((res, rej) =>
    crypto.scrypt(password, salt, 64, (err, key) =>
      err ? rej(err) : res(key.toString("hex"))
    )
  );
  return `${salt}:${hash}`;
}

export async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const derived = await new Promise((res, rej) =>
    crypto.scrypt(password, salt, 64, (err, key) =>
      err ? rej(err) : res(key.toString("hex"))
    )
  );
  return crypto.timingSafeEqual(
    Buffer.from(hash,    "hex"),
    Buffer.from(derived, "hex")
  );
}


// ── JWT ──

function b64u(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

function db64u(str) {
  return JSON.parse(Buffer.from(str, "base64url").toString());
}

export function signJWT(payload) {
  const header = b64u({ alg: "HS256", typ: "JWT" });
  const body   = b64u({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + config.jwtExpiry,
  });
  const sig = crypto
    .createHmac("sha256", config.jwtSecret)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifyJWT(token) {
  const parts = token?.split(".");
  if (parts?.length !== 3) throw authError("Malformed token");

  const [header, body, sig] = parts;
  const expected = crypto
    .createHmac("sha256", config.jwtSecret)
    .update(`${header}.${body}`)
    .digest("base64url");

  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw authError("Invalid token signature");
  }

  const payload = db64u(body);
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw Object.assign(new Error("Token expired"), { status: 401, code: "TOKEN_EXPIRED" });
  }

  return payload;
}

function authError(msg) {
  return Object.assign(new Error(msg), { status: 401, code: "UNAUTHORIZED" });
}
