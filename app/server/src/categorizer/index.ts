/**
 * Categorizer entry point — anonymize + rules engine.
 */
import { anonymize } from "./anonymize.js";
import { categorize, type Tags } from "./rules.js";
import type { N4BRow } from "../db/mssql.js";
import type { TicketRow } from "../db/cache.js";

export { type Tags };

/**
 * N4B ham satırı → kategorize edilmiş TicketRow.
 *
 * Müşteri sorusu + tespit + çözüm:
 *   - Hepsi anonimleştirilir (müşteri/telefon maskelenir)
 *   - Normalize edilir (TR→ASCII, lowercase, noktalama temiz)
 *   - Kural-tabanlı kategorize ŞU AN sadece çözüm metnine bakıyor
 *     (manuel kategorize Agent'lar 3'üne birden bakacak)
 */
export function categorizeN4BRow(row: N4BRow): TicketRow | null {
  const rawCozum = row.cozumText ?? "";
  if (rawCozum.trim().length < 30) return null; // anlamsız kısa kayıtları at

  const musteriSorunu = anonymize(row.musteriSorunu ?? "");
  const tespitSorun = anonymize(row.tespitSorun ?? "");
  const cozum = anonymize(rawCozum);

  // Kural-tabanlı (otomatik) kategorize — şimdilik çözüm metni yeterli
  const tags = categorize(cozum);

  return {
    bildirimNo: row.bildirimNo,
    kullanici: row.kullanici,
    gdt: row.gdt,
    musteriSorunu,
    tespitSorun,
    cozumText: cozum,
    cozumLen: cozum.length,
    isSureci: tags.isSureci,
    islemTipi: tags.islemTipi,
    etkilenenNesne: tags.etkilenenNesne,
    etki: tags.etki,
    kokNedenGrup: tags.kokNedenGrup,
    kokNedenDetay: tags.kokNedenDetay,
    cozumTipi: tags.cozumTipi,
    platform: null, // v3 alanları rule-based'ta boş, manuel kategorize doldurur
    selfServis: null,
    confidence: 0.85,
    reason: "rule-based v2",
    categorizedAt: new Date().toISOString(),
  };
}
