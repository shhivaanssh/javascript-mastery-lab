// ═══════════════════════════════════════════
// REQUEST VALIDATION
// ═══════════════════════════════════════════

// Never trust data from the client.
// Validate before it touches your business logic or database.


// ── Schema-based validation (no dependencies) ──

class ValidationError extends Error {
  constructor(details) {
    super("Validation failed");
    this.name    = "ValidationError";
    this.details = details; // [{ field, message }]
    this.status  = 422;
  }
}

function required(value, field) {
  if (value == null || value === "") return `${field} is required`;
  return null;
}

function isString(value, field, { min, max } = {}) {
  if (typeof value !== "string") return `${field} must be a string`;
  if (min && value.trim().length < min) return `${field} must be at least ${min} characters`;
  if (max && value.trim().length > max) return `${field} must be at most ${max} characters`;
  return null;
}

function isEmail(value, field) {
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return `${field} must be a valid email`;
  return null;
}

function isNumber(value, field, { min, max, integer } = {}) {
  const n = Number(value);
  if (isNaN(n)) return `${field} must be a number`;
  if (integer && !Number.isInteger(n)) return `${field} must be an integer`;
  if (min != null && n < min) return `${field} must be >= ${min}`;
  if (max != null && n > max) return `${field} must be <= ${max}`;
  return null;
}

function isOneOf(value, field, options) {
  if (!options.includes(value)) return `${field} must be one of: ${options.join(", ")}`;
  return null;
}

function isBoolean(value, field) {
  if (typeof value !== "boolean") return `${field} must be a boolean`;
  return null;
}

// ── Schema validator ──

function validate(body, schema) {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = body[field];

    for (const rule of rules) {
      const error = rule(value, field);
      if (error) { errors.push({ field, message: error }); break; }
    }
  }

  if (errors.length) throw new ValidationError(errors);
  return body;
}

// Usage
function validateCreateUser(body) {
  return validate(body, {
    name:     [v => required(v, "name"),    v => isString(v, "name",  { min: 2, max: 100 })],
    email:    [v => required(v, "email"),   v => isString(v, "email"), v => isEmail(v, "email")],
    password: [v => required(v, "password"),v => isString(v, "password", { min: 8, max: 128 })],
    age:      [v => v != null ? isNumber(v, "age", { min: 0, max: 150, integer: true }) : null],
    role:     [v => v != null ? isOneOf(v, "role", ["user", "admin", "mod"]) : null],
  });
}

// validateCreateUser({ name: "A", email: "bad", password: "short" })
// → ValidationError { details: [
//     { field: "name",  message: "name must be at least 2 characters" },
//     { field: "email", message: "email must be a valid email" },
//     { field: "password", message: "password must be at least 8 characters" }
//   ] }


// ── Sanitization ──

function sanitize(body, schema) {
  const clean = {};
  for (const key of Object.keys(schema)) {
    const value = body[key];
    if (value === undefined) continue;
    // Trim strings
    clean[key] = typeof value === "string" ? value.trim() : value;
  }
  return clean;
}

// HTML escaping — prevent XSS in stored data
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ═══════════════════════════════════════════
// ERROR HANDLING PATTERNS
// ═══════════════════════════════════════════

// ── Custom error classes ──

class AppError extends Error {
  constructor(message, { status = 500, code = "INTERNAL_ERROR" } = {}) {
    super(message);
    this.name   = "AppError";
    this.status = status;
    this.code   = code;
  }
}

class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, { status: 404, code: "NOT_FOUND" });
    this.name = "NotFoundError";
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, { status: 401, code: "UNAUTHORIZED" });
    this.name = "UnauthorizedError";
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Access denied") {
    super(message, { status: 403, code: "FORBIDDEN" });
    this.name = "ForbiddenError";
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, { status: 409, code: "CONFLICT" });
    this.name = "ConflictError";
  }
}


// ── Global error handler (Express) ──

function errorHandler(err, req, res, next) {
  const isProd = process.env.NODE_ENV === "production";

  // Log everything, but carefully in production
  const logLevel = err.status >= 500 ? "error" : "warn";
  console[logLevel](`[${req.method} ${req.path}]`, err.message, isProd ? "" : err.stack);

  // Normalise to AppError shape
  if (err.name === "ValidationError") {
    return res.status(422).json({
      ok: false,
      error: { code: "VALIDATION_ERROR", message: err.message, details: err.details },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      ok: false,
      error: { code: err.code, message: err.message },
    });
  }

  // Unknown error — 500
  res.status(500).json({
    ok: false,
    error: {
      code:    "INTERNAL_ERROR",
      message: isProd ? "Something went wrong" : err.message,
    },
  });
}


// ── Async error wrapper ──

// Instead of try/catch in every route handler:
const wrap = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Route handlers become clean:
// router.get("/:id", wrap(async (req, res) => {
//   const user = await db.getUserById(req.params.id);
//   if (!user) throw new NotFoundError("User");
//   res.json({ ok: true, data: user });
// }));


// ── Result pattern for service layer ──
// Service functions return { data } or throw — never return errors.
// HTTP layer handles the error → status mapping.

async function getUserService(id) {
  const user = await db.findById(id);
  if (!user) throw new NotFoundError("User");
  return user; // just return, never { error: ... }
}

// Route:
// router.get("/:id", wrap(async (req, res) => {
//   const user = await getUserService(req.params.id); // throws NotFoundError → 404
//   res.json({ ok: true, data: user });
// }));


// ── Error codes reference ──
//
// Use machine-readable codes alongside HTTP status.
// Frontend can use the code to show the right message in any language.
//
// VALIDATION_ERROR   422  — body validation failed
// NOT_FOUND          404  — resource doesn't exist
// UNAUTHORIZED       401  — no/invalid authentication
// FORBIDDEN          403  — authenticated but not allowed
// CONFLICT           409  — duplicate or state conflict
// RATE_LIMITED       429  — too many requests
// INTERNAL_ERROR     500  — unexpected server error
// BAD_REQUEST        400  — malformed request
// TOKEN_EXPIRED      401  — JWT has expired
// INVALID_CREDENTIALS 401 — wrong email/password


// Stub to prevent errors
const db = { findById: async (id) => null };
