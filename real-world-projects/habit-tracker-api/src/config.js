const env = process.env;

function required(key) {
  const val = env[key];
  if (!val && env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

export const config = {
  env:    env.NODE_ENV      ?? "development",
  port:   Number(env.PORT   ?? 3000),
  dbPath: env.DB_PATH       ?? "./data/habits.db",

  jwt: {
    secret: env.JWT_SECRET ?? (() => {
      if (env.NODE_ENV === "production") required("JWT_SECRET");
      console.warn("⚠  JWT_SECRET not set — using insecure default (dev only)");
      return "dev-secret-do-not-use-in-production-change-this";
    })(),
    expiresIn: Number(env.JWT_EXPIRY_SECONDS ?? 604800), // 7 days
  },

  isDev:  (env.NODE_ENV ?? "development") === "development",
  isProd:  env.NODE_ENV === "production",
  isTest:  env.NODE_ENV === "test",
};