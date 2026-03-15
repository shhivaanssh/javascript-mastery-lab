// ═══════════════════════════════════════════
// HTTP FUNDAMENTALS
// ═══════════════════════════════════════════

// HTTP is a stateless request/response protocol.
// Every request is independent — the server remembers nothing by default.
// State is maintained by the CLIENT (cookies, headers, tokens).


// ── HTTP Methods ──
//
// GET     — retrieve a resource. Safe (no side effects) + idempotent.
//            No body. Params go in query string.
//
// POST    — create a resource or trigger an action.
//            Not idempotent — calling twice creates two resources.
//            Body carries data.
//
// PUT     — replace a resource entirely. Idempotent.
//            Body must contain the full representation.
//
// PATCH   — partial update. Not necessarily idempotent.
//            Body contains only the fields to change.
//
// DELETE  — remove a resource. Idempotent.
//
// HEAD    — same as GET but no body returned. Used to check if resource exists.
//
// OPTIONS — describe what methods a resource supports.
//            Browsers send this as a CORS preflight.


// ── Status Codes ──
//
// 1xx  Informational
//   100 Continue
//
// 2xx  Success
//   200 OK               — generic success, used for GET/PUT/PATCH
//   201 Created          — POST succeeded, new resource created
//   204 No Content       — DELETE succeeded, nothing to return
//
// 3xx  Redirection
//   301 Moved Permanently — update bookmarks, cached
//   302 Found             — temporary redirect, not cached
//   304 Not Modified      — client cache is still valid
//
// 4xx  Client Error
//   400 Bad Request       — malformed syntax, invalid body
//   401 Unauthorized      — not authenticated (misleading name)
//   403 Forbidden         — authenticated but not authorized
//   404 Not Found         — resource doesn't exist
//   405 Method Not Allowed— wrong HTTP method for this endpoint
//   409 Conflict          — state conflict (duplicate, version mismatch)
//   422 Unprocessable     — validation failed (body was parseable but invalid)
//   429 Too Many Requests — rate limited
//
// 5xx  Server Error
//   500 Internal Server Error — unhandled exception — generic fallback
//   502 Bad Gateway           — upstream server returned bad response
//   503 Service Unavailable   — overloaded or under maintenance


// ── Important Headers ──
//
// REQUEST headers:
//   Content-Type:   "application/json" — format of the request body
//   Accept:         "application/json" — format the client wants back
//   Authorization:  "Bearer <token>"   — auth credential
//   X-Request-ID:   "uuid"             — for tracing across services
//   Cache-Control:  "no-cache"
//
// RESPONSE headers:
//   Content-Type:   "application/json; charset=utf-8"
//   Location:       "/users/42"        — set on 201 Created
//   Cache-Control:  "max-age=3600"
//   ETag:           '"abc123"'         — version fingerprint for caching
//   Retry-After:    "60"               — set on 429


// ── REST Principles (Roy Fielding, 2000) ──
//
// 1. Client-Server       — separate concerns, stateless protocol
// 2. Stateless           — each request carries all context; no session on server
// 3. Cacheable           — responses must declare if they're cacheable
// 4. Uniform Interface   — resources addressed by nouns, not verbs
// 5. Layered System      — client doesn't care if it hits a CDN, load balancer, etc.
// 6. Code on Demand      — (optional) server can send executable code


// ── RESTful URL design ──
//
// Nouns, not verbs. URLs identify resources; methods express actions.
//
// Collection:           /users              — the set
// Item:                 /users/42           — specific resource
// Sub-collection:       /users/42/posts     — posts owned by user 42
// Sub-item:             /users/42/posts/7
//
// ✅ GOOD
//   GET     /users            → list users
//   POST    /users            → create user
//   GET     /users/42         → get user 42
//   PUT     /users/42         → replace user 42
//   PATCH   /users/42         → update fields on user 42
//   DELETE  /users/42         → delete user 42
//   GET     /users/42/posts   → posts by user 42
//
// ❌ BAD (verbs in URLs)
//   GET  /getUser
//   POST /createUser
//   POST /users/42/delete


// ── API Versioning ──
//
// Always version your API from day one. Breaking changes need a new version.
//
// Common strategies:
//   URL path:    /v1/users  /v2/users          — most visible, easiest
//   Header:      API-Version: 2                — cleaner URLs
//   Query param: /users?version=2              — easy to test, messy
//
// Recommended: URL path versioning for public APIs.


// ── JSON API response envelope ──

// Consistent shape — clients always know where to look

// Success
const successResponse = {
  ok:   true,
  data: { id: 1, name: "Alex" },
};

// Success (list)
const listResponse = {
  ok:   true,
  data: [{ id: 1 }, { id: 2 }],
  meta: { total: 42, page: 1, limit: 20 },
};

// Error
const errorResponse = {
  ok:    false,
  error: {
    code:    "VALIDATION_ERROR",       // machine-readable code
    message: "Email is invalid",       // human-readable
    field:   "email",                  // optional: which field
    details: [                         // optional: multiple errors
      { field: "email", message: "Invalid format" },
      { field: "password", message: "Too short" },
    ],
  },
};


// ── Rate limiting ──
//
// Always rate limit your API. Without it, one bad actor can take down your service.
//
// Response headers to include:
//   X-RateLimit-Limit:     100     — max requests per window
//   X-RateLimit-Remaining: 97      — requests left in current window
//   X-RateLimit-Reset:     1640000 — Unix timestamp when window resets
//   Retry-After:           60      — seconds until allowed again (on 429)


// ── CORS — Cross-Origin Resource Sharing ──
//
// Browser security policy: JS on example.com can only fetch from example.com
// unless the API explicitly allows other origins.
//
// Required headers on API responses:
//   Access-Control-Allow-Origin:  "https://myapp.com"   (or "*" for public)
//   Access-Control-Allow-Methods: "GET, POST, PUT, DELETE, OPTIONS"
//   Access-Control-Allow-Headers: "Content-Type, Authorization"
//   Access-Control-Max-Age:       "86400"
//
// Preflight: browser sends OPTIONS before POST/PUT/PATCH with custom headers.
// The API must respond to OPTIONS with the above headers and 204 No Content.
