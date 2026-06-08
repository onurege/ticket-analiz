/*
 * KB ingestion CLI — `npx tsx scripts/ingest-kb.ts [flags]`
 *
 * Akış:
 *   1. Seçili connector'lardan döküman üret + chunk + DB'ye yaz
 *   2. Bekleyen embedding'leri toplu işle (resumable)
 *   3. Final istatistikleri yazdır
 *
 * Flag'ler:
 *   --pdfs            Sadece PDF connector çalıştır
 *   --screens         Sadece panorama-screens connector çalıştır
 *   --tickets         Sadece MSSQL/local ticket connector çalıştır
 *   (hiçbiri verilmezse hepsi çalışır)
 *   --skip-embed      Sadece chunk üret, embedding atla
 *   --max-embed N     Bu run'da en fazla N chunk için embedding üret (default 5000)
 *   --batch-size N    Embedding batch boyutu (default 16)
 *   --tickets-limit N Maks N adet resolved ticket ingest et (default 5000)
 *   --pdf-dir PATH    PDF klasörü (default data/kb/pdfs)
 *   --screens-path P  screens.json yolu (default data/panorama-docs/screens.json)
 *   --project PROJ    Sadece bu projeden ticket'lar (opsiyonel)
 */

import "dotenv/config";
import { embedPendingChunks } from "../src/lib/kb/embedder";
import { ingestAllPdfs } from "../src/lib/kb/sources/pdf";
import { ingestAllDocx } from "../src/lib/kb/sources/docx";
import { ingestPanoramaScreens } from "../src/lib/kb/sources/panorama-screens";
import { ingestTicketResolutions } from "../src/lib/kb/sources/mssql";
import { ingestN4bCozumler } from "../src/lib/kb/sources/n4b-cozumler";
import { kbStats, isVecAvailable } from "../src/lib/kb/db";

type Args = {
  pdfs: boolean;
  docs: boolean;
  screens: boolean;
  tickets: boolean;
  n4b: boolean;
  skipEmbed: boolean;
  maxEmbed: number;
  batchSize: number;
  ticketsLimit: number;
  pdfDir: string;
  docsDir: string;
  screensPath: string;
  project: string | null;
};

function parseArgs(argv: string[]): Args {
  const flags: Args = {
    pdfs: false,
    docs: false,
    screens: false,
    tickets: false,
    n4b: false,
    skipEmbed: false,
    maxEmbed: 5000,
    batchSize: 16,
    ticketsLimit: 5000,
    pdfDir: "data/kb/pdfs",
    docsDir: "data/kb/docs",
    screensPath: "data/panorama-docs/screens.json",
    project: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a) continue;
    switch (a) {
      case "--pdfs":
        flags.pdfs = true;
        break;
      case "--docs":
      case "--docx":
        flags.docs = true;
        break;
      case "--screens":
        flags.screens = true;
        break;
      case "--tickets":
        flags.tickets = true;
        break;
      case "--n4b":
      case "--cozumler":
        flags.n4b = true;
        break;
      case "--skip-embed":
        flags.skipEmbed = true;
        break;
      case "--max-embed":
        flags.maxEmbed = Number(argv[++i] ?? flags.maxEmbed);
        break;
      case "--batch-size":
        flags.batchSize = Number(argv[++i] ?? flags.batchSize);
        break;
      case "--tickets-limit":
        flags.ticketsLimit = Number(argv[++i] ?? flags.ticketsLimit);
        break;
      case "--pdf-dir":
        flags.pdfDir = argv[++i] ?? flags.pdfDir;
        break;
      case "--docs-dir":
        flags.docsDir = argv[++i] ?? flags.docsDir;
        break;
      case "--screens-path":
        flags.screensPath = argv[++i] ?? flags.screensPath;
        break;
      case "--project":
        flags.project = argv[++i] ?? null;
        break;
      default:
        if (a.startsWith("--")) {
          console.warn(`Bilinmeyen flag: ${a}`);
        }
    }
  }
  // Hiçbir kaynak flag'i verilmediyse hepsini çalıştır
  if (!flags.pdfs && !flags.docs && !flags.screens && !flags.tickets && !flags.n4b) {
    flags.pdfs = true;
    flags.docs = true;
    flags.screens = true;
    flags.tickets = true;
    flags.n4b = true;
  }
  return flags;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  console.log("KB ingestion başlıyor:", args);
  console.log("sqlite-vec yüklendi:", isVecAvailable());

  if (args.pdfs) {
    console.log("\n=== PDF ingestion ===");
    await ingestAllPdfs(args.pdfDir);
  }
  if (args.docs) {
    console.log("\n=== DOCX ingestion ===");
    await ingestAllDocx(args.docsDir);
  }
  if (args.screens) {
    console.log("\n=== Panorama screens ingestion ===");
    ingestPanoramaScreens(args.screensPath);
  }
  if (args.tickets) {
    console.log("\n=== Ticket resolutions (lokal sqlite'tan) ===");
    ingestTicketResolutions({
      limit: args.ticketsLimit,
      project: args.project,
      resolvedOnly: true,
    });
  }
  if (args.n4b) {
    console.log("\n=== N4B operatör çözüm notları ===");
    try {
      const res = ingestN4bCozumler({ limit: 5000 });
      const changed = res.filter((r) => r.changed).length;
      console.log(`  ${res.length} not işlendi, ${changed} doc güncellendi.`);
    } catch (err) {
      console.warn(`  ATLANDI: ${(err as Error).message}`);
    }
  }

  if (!args.skipEmbed) {
    console.log("\n=== Embedding ===");
    const res = await embedPendingChunks({
      batchSize: args.batchSize,
      maxChunks: args.maxEmbed,
      onProgress: (p) => {
        if (p.done % 50 === 0) console.log(`  ${p.done} chunk gömüldü`);
      },
    });
    console.log(
      `Toplam embed: ${res.embedded}, atlanan: ${res.skipped}, süre: ${(res.durationMs / 1000).toFixed(1)}s`,
    );
  }

  console.log("\n=== KB Stats ===");
  const stats = kbStats();
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((err) => {
  console.error("KB ingestion hatası:", err);
  process.exit(1);
});
