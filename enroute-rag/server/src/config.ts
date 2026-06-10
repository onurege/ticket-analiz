/**
 * Ortam değişkenleri — tek nokta.
 */
import "dotenv/config";

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Eksik ortam değişkeni: ${name}`);
  return v;
}

function num(name: string, def: number): number {
  const v = process.env[name];
  return v ? Number(v) : def;
}

export const config = {
  mssql: {
    server: req("TICKET_MSSQL_SERVER"),
    instance: process.env.TICKET_MSSQL_INSTANCE,
    port: num("TICKET_MSSQL_PORT", 1433),
    database: req("TICKET_MSSQL_DATABASE"),
    user: req("TICKET_MSSQL_USER"),
    password: req("TICKET_MSSQL_PASSWORD"),
    encrypt: process.env.TICKET_MSSQL_ENCRYPT === "true",
    trustServerCertificate: process.env.TICKET_MSSQL_TRUST_SERVER_CERT !== "false",
  },
  server: {
    port: num("PORT", 4000),
    host: process.env.HOST ?? "0.0.0.0",
    env: process.env.NODE_ENV ?? "development",
    webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
  },
  cache: {
    path: process.env.CACHE_DB_PATH ?? "./data/cache.sqlite",
  },
  ingestor: {
    pollSeconds: num("INGESTOR_POLL_SECONDS", 300),
    bootstrapDays: num("INGESTOR_BOOTSTRAP_DAYS", 90),
  },
};
