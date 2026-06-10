/**
 * Ingestor worker — MSSQL'den incremental fetch, kategorize, SQLite'a yaz.
 *
 * - İlk açılış: son N gün (config.ingestor.bootstrapDays)
 * - Sonra: SQLite'taki MAX(gdt)'den itibaren
 * - node-cron ile periyodik
 */
import cron from "node-cron";
import { config } from "../config.js";
import { fetchSince, type N4BRow } from "../db/mssql.js";
import { upsertTickets, getLatestGdt, getMeta, setMeta } from "../db/cache.js";
import { categorizeN4BRow } from "../categorizer/index.js";

let running = false;

export async function runOnce(opts: { force?: boolean } = {}): Promise<number> {
  if (running) {
    console.log("[ingestor] zaten çalışıyor, atlanıyor");
    return 0;
  }
  running = true;
  const t0 = Date.now();

  try {
    // Watermark belirle
    let since: string;
    if (opts.force) {
      since = isoNDaysAgo(config.ingestor.bootstrapDays);
      console.log(`[ingestor] FORCE refresh — son ${config.ingestor.bootstrapDays} gün`);
    } else {
      const latest = getLatestGdt();
      if (latest) {
        since = latest;
        console.log(`[ingestor] incremental from ${since}`);
      } else {
        since = isoNDaysAgo(config.ingestor.bootstrapDays);
        console.log(`[ingestor] bootstrap — son ${config.ingestor.bootstrapDays} gün`);
      }
    }

    // Fetch
    const rows = await fetchSince(since);
    console.log(`[ingestor] MSSQL'den ${rows.length} satır`);

    if (rows.length === 0) {
      setMeta("last_run", new Date().toISOString());
      setMeta("last_fetched_count", "0");
      return 0;
    }

    // Categorize + filter
    const ticketRows = rows.map(categorizeN4BRow).filter((r): r is NonNullable<typeof r> => r !== null);

    // Upsert
    const n = upsertTickets(ticketRows);

    setMeta("last_run", new Date().toISOString());
    setMeta("last_fetched_count", String(n));

    const dt = Date.now() - t0;
    console.log(`[ingestor] ✓ ${n} ticket upsert (${dt} ms)`);
    return n;
  } catch (e) {
    console.error("[ingestor] HATA:", (e as Error).message);
    setMeta("last_error", `${new Date().toISOString()} ${(e as Error).message}`);
    return 0;
  } finally {
    running = false;
  }
}

export function startIngestor(): void {
  // İlk açılışta hemen bir kez çalıştır
  void runOnce();

  // node-cron — saniyeden dakikaya çevir
  const minutes = Math.max(1, Math.round(config.ingestor.pollSeconds / 60));
  const expr = `*/${minutes} * * * *`;
  console.log(`[ingestor] schedule: every ${minutes} min`);
  cron.schedule(expr, () => {
    void runOnce();
  });
}

function isoNDaysAgo(n: number): string {
  const d = new Date(Date.now() - n * 86_400_000);
  return d.toISOString();
}
