/**
 * Artımlı sync + embedding üretici.
 *
 * 1. View'dan son N gün çek (env.TICKET_ANALYSIS_LOOKBACK_DAYS).
 * 2. Lokal sqlite'a upsert.
 * 3. Embedding'i eksik veya text_hash değişmiş kayıtları batch'le Gemini'ye ver.
 * 4. Sonuçları kaydet.
 *
 * Hangi sayfada kaldığını sync_state.last_run + sync_state.last_synced_id ile
 * tutar; kesintide kaldığı yerden devam eder.
 *
 * Çalıştırma:
 *   npx tsx scripts/sync-and-embed.ts                 # default lookback
 *   npx tsx scripts/sync-and-embed.ts --days 30       # son 30 gün
 *   npx tsx scripts/sync-and-embed.ts --skip-embed    # sadece içerik sync
 *   npx tsx scripts/sync-and-embed.ts --max-embed 500 # bu run'da en fazla 500 vektör üret
 */
import { config as dotenv } from "dotenv";
dotenv({ path: ".env" });

import { runReadOnly, closePool, sql } from "../src/lib/db";
import { qualifyTable, quoteIdent } from "../src/lib/ticket/identifiers";
import { COL, TICKET_VIEW } from "../src/lib/ticket/source";
import {
  closeDb,
  getDb,
  hashText,
  saveEmbeddings,
  setSyncState,
  ticketCount,
  ticketEmbeddingText,
  ticketsNeedingEmbedding,
  upsertTickets,
  type LocalTicket,
} from "../src/lib/ticket/local-store";
import { embedBatch } from "../src/lib/gemini";
import { env } from "../src/lib/env";

const args = parseArgs(process.argv.slice(2));

function parseArgs(argv: string[]): {
  days: number | null;
  skipEmbed: boolean;
  maxEmbed: number;
  pageSize: number;
} {
  let days: number | null = null;
  let skipEmbed = false;
  let maxEmbed = 5_000;
  let pageSize = 500;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--days") days = Number(argv[++i] ?? "");
    else if (a === "--skip-embed") skipEmbed = true;
    else if (a === "--max-embed") maxEmbed = Number(argv[++i] ?? maxEmbed);
    else if (a === "--page-size") pageSize = Number(argv[++i] ?? pageSize);
  }
  return { days, skipEmbed, maxEmbed, pageSize };
}

const TABLE = qualifyTable(TICKET_VIEW.schema, TICKET_VIEW.name);

type ViewRow = {
  Bildirim_No: number;
  Bildirim_Tarihi_: Date | null;
  Bildirim_Tipi: string | null;
  Oncelik: string | null;
  Katman: string | null;
  PROJE: string | null;
  Urun: string | null;
  Ana_Kategori: string | null;
  Alt_Kategori: string | null;
  Kategori_Adi: string | null;
  Uzun_Kategori_Adi: string | null;
  Konunun_Kok_Nedeni: string | null;
  Acil_Ticket: string | null;
  Support_L1_L2: string | null;
  Bildirim_Aciklamasi: string | null;
  Cozum_Aciklamasi: string | null;
  Musteri_Notu: string | null;
  TfsNo: number | null;
  TfsDurum: string | null;
  TfsTip: string | null;
  BugGroup: string | null;
};

function selectSql(): string {
  const cols: Array<[string, string | null]> = [
    [COL.id, null],
    [COL.date, null],
    [COL.type, null],
    [COL.priority, null],
    [COL.layer, null],
    [COL.project, null],
    [COL.product, null],
    [COL.mainCategory, null],
    [COL.subCategory, null],
    [COL.categoryShort, null],
    [COL.categoryLong, null],
    [COL.rootCause, null],
    [COL.urgent, null],
    [COL.supportLevel, null],
    [COL.description, null],
    [COL.solution, null],
    [COL.customerNote, null],
    [COL.tfsNo, null],
    [COL.tfsStatus, null],
    [COL.tfsType, null],
    [COL.bugGroup, "BugGroup"],
  ];
  return cols
    .map(([raw, alias]) =>
      alias !== null
        ? `${quoteIdent(raw)} AS ${quoteIdent(alias)}`
        : quoteIdent(raw),
    )
    .join(", ");
}

async function fetchPage(
  days: number,
  afterId: number,
  pageSize: number,
): Promise<ViewRow[]> {
  const text = `
    SELECT TOP (@lim) ${selectSql()}
    FROM ${TABLE}
    WHERE ${quoteIdent(COL.date)} >= DATEADD(day, -@days, CAST(GETDATE() AS date))
      AND ${quoteIdent(COL.id)} > @afterId
    ORDER BY ${quoteIdent(COL.id)} ASC
  `;
  const r = await runReadOnly<ViewRow>(
    text,
    [
      { name: "days", type: sql.Int, value: days },
      { name: "afterId", type: sql.Int, value: afterId },
      { name: "lim", type: sql.Int, value: pageSize },
    ],
    { timeoutMs: 120_000 },
  );
  return r.rows;
}

function toLocal(r: ViewRow): LocalTicket {
  const aciklama = r.Bildirim_Aciklamasi;
  const cozum = r.Cozum_Aciklamasi;
  const kategori = r.Uzun_Kategori_Adi;
  const kokNeden = r.Konunun_Kok_Nedeni;
  const text = ticketEmbeddingText({
    kategori_uzun: kategori,
    kok_neden: kokNeden,
    aciklama,
    cozum,
  });
  return {
    bildirim_no: r.Bildirim_No,
    bildirim_tarihi: r.Bildirim_Tarihi_
      ? r.Bildirim_Tarihi_.toISOString().slice(0, 10)
      : null,
    bildirim_tipi: r.Bildirim_Tipi,
    oncelik: r.Oncelik,
    katman: r.Katman,
    proje: r.PROJE,
    urun: r.Urun,
    ana_kategori: r.Ana_Kategori,
    alt_kategori: r.Alt_Kategori,
    kategori_kisa: r.Kategori_Adi,
    kategori_uzun: kategori,
    kok_neden: kokNeden,
    acil_ticket: r.Acil_Ticket,
    support_seviye: r.Support_L1_L2,
    aciklama,
    cozum,
    musteri_notu: r.Musteri_Notu,
    tfs_no: r.TfsNo,
    tfs_durum: r.TfsDurum,
    tfs_tip: r.TfsTip,
    bug_group: r.BugGroup,
    text_hash: hashText(text),
  };
}

async function syncContent(days: number, pageSize: number): Promise<number> {
  // Ensure db is open
  getDb();
  let afterId = 0;
  let total = 0;
  for (;;) {
    process.stdout.write(`  sayfa: afterId=${afterId} ... `);
    const t0 = Date.now();
    const page = await fetchPage(days, afterId, pageSize);
    if (page.length === 0) {
      console.log("(boş, bitti)");
      break;
    }
    const rows = page.map(toLocal);
    upsertTickets(rows);
    const last = page[page.length - 1]!;
    afterId = last.Bildirim_No;
    total += rows.length;
    console.log(
      `${rows.length} kayıt (${Date.now() - t0}ms), şu ana kadar=${total}`,
    );
    setSyncState("last_synced_id", String(afterId));
    if (page.length < pageSize) break;
  }
  setSyncState("last_run_at", new Date().toISOString());
  return total;
}

async function embedMissing(maxEmbed: number): Promise<number> {
  const model = env().GEMINI_EMBEDDING_MODEL;
  let processed = 0;
  while (processed < maxEmbed) {
    const remaining = maxEmbed - processed;
    const want = Math.min(100, remaining);
    const pending = ticketsNeedingEmbedding(model, want);
    if (pending.length === 0) break;
    process.stdout.write(`  embed batch: ${pending.length} kayıt ... `);
    const t0 = Date.now();
    const vectors = await embedBatch(pending.map((p) => p.text));
    const items = pending.map((p, i) => ({
      bildirim_no: p.bildirim_no,
      text_hash: p.text_hash,
      vector: vectors[i]!,
    }));
    saveEmbeddings(items, model);
    processed += items.length;
    console.log(`OK (${Date.now() - t0}ms), toplam=${processed}`);
  }
  return processed;
}

async function main() {
  const e = env();
  const days = args.days ?? e.TICKET_ANALYSIS_LOOKBACK_DAYS;

  console.log(`>> Sync: son ${days} gün, page=${args.pageSize}`);
  const synced = await syncContent(days, args.pageSize);
  console.log(`   toplam senkron edilen: ${synced}, lokal toplam: ${ticketCount()}`);

  if (!args.skipEmbed) {
    if (!e.GEMINI_API_KEY) {
      console.log(`\n>> Embed atlandı: GEMINI_API_KEY .env'de yok`);
    } else {
      console.log(`\n>> Embed: max ${args.maxEmbed}, model=${e.GEMINI_EMBEDDING_MODEL}`);
      const n = await embedMissing(args.maxEmbed);
      console.log(`   üretilen embedding: ${n}`);
    }
  }
}

main()
  .catch((err) => {
    console.error("HATA:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
    closeDb();
  });
