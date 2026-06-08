/**
 * Faz 1 smoke testi — gerçek MSSQL'e bağlanır, allowlist üzerinden
 * üretilen sorguyla bir kaydı çekip raporlar. Read-only guard'ı tetikler.
 *
 * Çalıştırma:  npx tsx scripts/smoke-resolver.ts <bildirimNo?>
 */
import { config as dotenv } from "dotenv";
dotenv({ path: ".env" });

import { getByIdQuery, recentQuery } from "../src/lib/ticket/query-builder";
import { runReadOnly, closePool } from "../src/lib/db";
import type { TicketRow } from "../src/lib/ticket/types";

const arg = process.argv[2];
const bildirimNo = arg ? Number(arg) : 32511772;

async function main() {
  console.log(`>> getById(${bildirimNo})  [timeout=60s]`);
  const q1 = getByIdQuery(bildirimNo);
  const r1 = await runReadOnly<TicketRow>(q1.text, q1.params, { timeoutMs: 60_000 });
  const row = r1.rows[0] ?? null;
  console.log(`   sorgu süresi: ${r1.durationMs}ms, satır: ${r1.rowCount}`);
  if (!row) {
    console.log("   bulunamadı.");
  } else {
    console.log("   OK:", {
      Bildirim_No: row.Bildirim_No,
      Tarih: row.Bildirim_Tarihi_,
      Tipi: row.Bildirim_Tipi,
      Oncelik: row.Oncelik,
      Katman: row.Katman,
      Proje: row.PROJE,
      Kategori: row.Uzun_Kategori_Adi,
      KokNeden: row.Konunun_Kok_Nedeni,
      AciklamaOnizleme: row.Bildirim_Aciklamasi?.slice(0, 120) ?? null,
      CozumOnizleme: row.Cozum_Aciklamasi?.slice(0, 120) ?? null,
      BugGroup: row.BugGroup,
    });
  }

  console.log(`\n>> recent({ project: 'SUZUKI', limit: 3, withDescriptionOnly: true })  [timeout=60s]`);
  const q2 = recentQuery({
    lookbackDays: 30,
    limit: 3,
    project: "SUZUKI",
    withDescriptionOnly: true,
  });
  const r2 = await runReadOnly<TicketRow>(q2.text, q2.params, { timeoutMs: 60_000 });
  console.log(`   sorgu süresi: ${r2.durationMs}ms, ${r2.rowCount} kayıt:`);
  for (const r of r2.rows) {
    console.log(
      `   #${r.Bildirim_No}  ${r.Bildirim_Tarihi_?.toISOString().slice(0, 10) ?? "-"}  ${r.Bildirim_Tipi}  ${r.Oncelik}  ${r.Katman}`,
    );
  }
}

main()
  .catch((err) => {
    console.error("HATA:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
