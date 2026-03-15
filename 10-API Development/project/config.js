const env = process.env;

export const config = {
  env:       env.NODE_ENV      ?? "development",
  port:      Number(env.PORT   ?? 3000),
  dbPath:    env.DB_PATH       ?? ":memory:",
  jwtSecret: env.JWT_SECRET    ?? (() => {
    if (env.NODE_ENV === "production") throw new Error("JWT_SECRET required in production");
    return "dev-secret-do-not-use-in-production";
  })(),
  jwtExpiry:      Number(env.JWT_EXPIRY_SECONDS ?? 604800), // 7 days
  bcryptRounds:   Number(env.BCRYPT_ROUNDS      ?? 12),
  corsOrigin:     env.CORS_ORIGIN  ?? "*",
  isDev:  (env.NODE_ENV ?? "development") === "development",
  isProd:  env.NODE_ENV === "production",
  isTest:  env.NODE_ENV === "test",
};
