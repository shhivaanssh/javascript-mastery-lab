export const config = {
  env:    process.env.NODE_ENV ?? "development",
  port:   Number(process.env.PORT    ?? 4000),
  dbPath: process.env.DB_PATH ?? "./data/devnotes.db",
  isDev:  (process.env.NODE_ENV ?? "development") === "development",
  isProd: process.env.NODE_ENV === "production",
};
