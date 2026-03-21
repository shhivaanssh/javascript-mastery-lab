import { verifyJWT }                           from "../services/auth.js";
import { UnauthorizedError, ForbiddenError }   from "../utils/errors.js";

/**
 * requireAuth — attach req.user or throw 401.
 * Expects:  Authorization: Bearer <token>
 */
export function requireAuth(req, res, next) {
  const header = req.headers["authorization"];

  if (!header?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Authorization header missing or malformed"));
  }

  try {
    const token = header.slice(7).trim();
    req.user    = verifyJWT(token);  // { sub, name, iat, exp }
    next();
  } catch (err) {
    next(err); // UnauthorizedError or TokenExpiredError — caught by errorHandler
  }
}

/**
 * requireRole — must come after requireAuth.
 * Usage: router.delete("/", requireAuth, requireRole("admin"), handler)
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError("Insufficient permissions"));
    }
    next();
  };
}