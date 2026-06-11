/**
 * Server bootstrap — API + Ingestor worker tek process.
 */
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { ping as mssqlPing } from "./db/mssql.js";
import { getDb, countTickets } from "./db/cache.js";
import { registerStatsRoutes } from "./api/stats.js";
import { registerStatsV1Routes } from "./api/stats-v1.js";
import { registerTicketRoutes } from "./api/tickets.js";
import { registerRecategorizeRoutes } from "./api/recategorize.js";
import { registerCategorizeRoutes } from "./api/categorize.js";
import { registerFeedbackRoutes } from "./api/feedback.js";
import { registerV1Routes } from "./api/v1.js";
import { indexStats } from "./lib/vector-store.js";
import { startIngestor, runOnce } from "./ingestor/index.js";

async function bootstrap(): Promise<void> {
  // SQLite init
  getDb();
  console.log(`[boot] cache: ${countTickets()} ticket önbellekte`);

  const app = Fastify({
    logger: { level: config.server.env === "development" ? "info" : "warn" },
  });

  // CORS: dev/UI + Varuna gibi dış sistemler için hepsi açık
  // (auth ileride Bearer Token ile yapılacak — şimdilik her isteği kabul)
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  // Health
  app.get("/api/health", async () => {
    const m = await mssqlPing();
    return {
      ok: m.ok,
      mssql: m,
      cache: { count: countTickets() },
      uptime: process.uptime(),
    };
  });

  registerStatsRoutes(app);
  registerStatsV1Routes(app);
  registerTicketRoutes(app);
  registerRecategorizeRoutes(app);
  registerCategorizeRoutes(app);
  registerFeedbackRoutes(app);

  // ─── /api/v1/* — Varuna entegrasyonu ────────────────────────
  // v1.ts içinde: /health, /stats, /categorize, /kb/search, /kb/ask, /analyze
  await app.register(registerV1Routes, { prefix: "/api/v1" });

  // Health'e vector store ekle
  app.get("/api/health/embeddings", async () => indexStats());

  // Manual refresh
  app.post("/api/refresh", async () => {
    const n = await runOnce({ force: true });
    return { ok: true, fetched: n };
  });

  // ─── Static web (production) ────────────────────────────────
  // Web build edilmişse (../web/dist) onu serve et — tek port'tan UI + API.
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const webDist = resolve(__dirname, "../../web/dist");
  if (existsSync(webDist)) {
    await app.register(fastifyStatic, {
      root: webDist,
      prefix: "/",
      wildcard: false,
    });
    // SPA fallback — /api dışındaki tüm GET'ler index.html'e
    app.setNotFoundHandler((req, reply) => {
      if (req.method !== "GET" || req.url.startsWith("/api/")) {
        reply.code(404).send({ error: "Not Found" });
        return;
      }
      reply.sendFile("index.html");
    });
    console.log(`[boot] static web: ${webDist}`);
  } else {
    console.log(`[boot] static web yok (dev mode): ${webDist}`);
  }

  await app.listen({ port: config.server.port, host: config.server.host });
  console.log(`[boot] API hazır: http://${config.server.host}:${config.server.port}`);

  // Ingestor worker
  startIngestor();
}

bootstrap().catch((e) => {
  console.error("[fatal]", e);
  process.exit(1);
});

// Graceful shutdown
for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, async () => {
    console.log(`[shutdown] ${sig} alındı`);
    process.exit(0);
  });
}
