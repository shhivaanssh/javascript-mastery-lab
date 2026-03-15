import crypto from "crypto";


// ═══════════════════════════════════════════
// SESSIONS vs JWT
// ═══════════════════════════════════════════
//
// SESSIONS (stateful)
// ───────────────────
// Server stores session data in memory/DB/Redis.
// Client stores only a session ID cookie.
//
//   Client          Server              Store
//   ──────          ──────              ─────
//   POST /login ──► verify creds
//                   create session ───► { sid: "abc", userId: 1, role: "admin" }
//                   Set-Cookie: sid=abc
//   GET /profile ─► read Cookie: sid=abc
//                   lookup session ──► { userId: 1, role: "admin" }
//                   return profile
//
// Pros:  Easy to revoke (delete from store). Small cookie.
// Cons:  Requires shared store for horizontal scaling. Extra DB lookup per request.
//
//
// JWT (stateless)
// ───────────────
// Server issues a signed token. Client sends it on every request.
// Server validates the signature — NO database lookup needed.
//
//   Client          Server
//   ──────          ──────
//   POST /login ──► verify creds
//                   sign JWT → header.payload.signature
//                   return { token: "eyJ..." }
//   GET /profile ─► Authorization: Bearer eyJ...
//                   verify signature (no DB)
//                   read payload → { userId: 1, role: "admin" }
//                   return profile
//
// Pros:  Stateless — scales horizontally. No DB lookup to validate.
// Cons:  Can't invalidate before expiry (must use a blocklist for logout).
//        Larger than a session cookie. Secret key management critical.
//
// Rule of thumb:
//   Sessions  → traditional server-rendered apps, when revocation is critical
//   JWT       → APIs consumed by SPAs, mobile apps, microservices


// ═══════════════════════════════════════════
// JWT — How it works
// ═══════════════════════════════════════════
//
// A JWT has 3 parts separated by dots:   header.payload.signature
//
// header    = base64url({ alg: "HS256", typ: "JWT" })
// payload   = base64url({ sub: "1", role: "admin", exp: 1700000000 })
// signature = HMAC-SHA256(header + "." + payload, secret)
//
// Standard payload claims:
//   sub   — subject (user ID)
//   iat   — issued at (Unix timestamp)
//   exp   — expires at (Unix timestamp)
//   iss   — issuer (your API name)
//   aud   — audience (who it's for)


// ── JWT implementation with Node's built-in crypto ──

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
const JWT_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

function base64urlEncode(obj) {
  return Buffer.from(JSON.stringify(obj))
    .toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64urlDecode(str) {
  const padded = str + "=".repeat((4 - str.length % 4) % 4);
  return JSON.parse(Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
}

function sign(payload) {
  const header    = base64urlEncode({ alg: "HS256", typ: "JWT" });
  const body      = base64urlEncode({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY,
  });
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  return `${header}.${body}.${signature}`;
}

function verify(token) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");

  const [header, body, sig] = parts;

  // Re-compute expected signature
  const expected = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  // Timing-safe comparison — prevents timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error("Invalid signature");
  }

  const payload = base64urlDecode(body);

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    const err = new Error("Token expired");
    err.code  = "TOKEN_EXPIRED";
    throw err;
  }

  return payload;
}

// Test
const token   = sign({ sub: "1", role: "admin" });
const payload = verify(token);
console.log("Token:", token.slice(0, 40) + "...");
console.log("Payload:", payload);


// ── Password hashing with scrypt ──
// Never store plain passwords. Use a slow hash: scrypt, bcrypt, or argon2.
// scrypt is built into Node's crypto module.

async function hashPassword(password) {
  const salt   = crypto.randomBytes(16).toString("hex");
  const hash   = await new Promise((resolve, reject) =>
    crypto.scrypt(password, salt, 64, (err, key) =>
      err ? reject(err) : resolve(key.toString("hex"))
    )
  );
  return `${salt}:${hash}`; // store both together
}

async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const derived = await new Promise((resolve, reject) =>
    crypto.scrypt(password, salt, 64, (err, key) =>
      err ? reject(err) : resolve(key.toString("hex"))
    )
  );
  // Timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(hash,    "hex"),
    Buffer.from(derived, "hex")
  );
}

// Test
const hashed  = await hashPassword("my-password");
const isValid = await verifyPassword("my-password", hashed);
console.log("Password valid:", isValid);
console.log("Hash:", hashed.slice(0, 40) + "...");


// ── Auth middleware (Express-style) ──

function requireAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const token   = authHeader.slice(7);
    req.user      = verify(token); // attach payload to request
    next();
  } catch (err) {
    const status  = err.code === "TOKEN_EXPIRED" ? 401 : 401;
    const code    = err.code ?? "INVALID_TOKEN";
    res.status(status).json({ error: err.message, code });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

// Usage in routes:
// router.get("/admin/users", requireAuth, requireRole("admin"), listAllUsers);
// router.get("/profile",     requireAuth, getMyProfile);


// ── Refresh tokens ──
// Short-lived access token (15min) + long-lived refresh token (30 days).
// Access token validates requests. Refresh token gets a new access token.
//
// Flow:
//   1. Login → return { accessToken (15min), refreshToken (30d) }
//   2. Request → Authorization: Bearer <accessToken>
//   3. Access token expires → POST /auth/refresh with refreshToken
//   4. Server validates refreshToken, issues new accessToken
//   5. Store refreshToken in httpOnly cookie (not localStorage — XSS safe)
//
// Revocation: store refresh tokens in DB; delete on logout or suspicious activity.


// ── Security checklist ──
//
// ✓ Hash passwords with scrypt/bcrypt (never MD5, SHA1, or plain SHA256)
// ✓ Use timing-safe comparisons for secrets
// ✓ Set JWT expiry — never issue forever tokens
// ✓ Use a strong, random JWT secret (32+ bytes)
// ✓ Store JWT secret in environment variable, never in code
// ✓ Use httpOnly cookies for refresh tokens
// ✓ Rate limit /auth/login and /auth/register
// ✓ Never log passwords, tokens, or sensitive data
// ✓ Validate all input before touching the database
// ✓ Use parameterized queries — never string-concat SQL
// ✓ Set security headers (CORS, X-Content-Type-Options, etc.)
