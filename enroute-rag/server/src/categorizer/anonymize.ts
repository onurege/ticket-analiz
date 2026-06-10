/**
 * Çözüm metni normalleştirme + anonimleştirme.
 *
 * Türkçe karakterleri ASCII'ye düşürür, noktalama temizler.
 * Telefon ve müşteri adlarını <TEL> / <MUSTERI> ile maskeler.
 *
 * NOT: Müşteri blocklist'i mevcut ise opsiyonel olarak yüklenir.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const TR_MAP: Record<string, string> = {
  İ: "I", ı: "i",
  Ğ: "G", ğ: "g",
  Ü: "U", ü: "u",
  Ş: "S", ş: "s",
  Ö: "O", ö: "o",
  Ç: "C", ç: "c",
};

export function normalizeForMatch(s: string): string {
  let r = s;
  for (const [k, v] of Object.entries(TR_MAP)) r = r.split(k).join(v);
  return r
    .toLowerCase()
    .replace(/[^\w\s<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Telefon numarası deseni (TR formatı)
const PHONE_RE = /(?:\+?9?0?[\s.-]?)?\(?(?:5\d{2})\)?[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/g;

type Needle = { canonical: string; pattern: RegExp };
let needles: Needle[] | null = null;

function loadBlocklist(): Needle[] {
  if (needles) return needles;
  const candidates = [
    process.env.BLOCKLIST_PATH,
    path.resolve(process.cwd(), "data/customer-blocklist.json"),
    path.resolve(process.cwd(), "../../data/customer-blocklist.json"),
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    if (existsSync(p)) {
      try {
        const bl = JSON.parse(readFileSync(p, "utf8")) as {
          customers: { canonical: string; normalized: string }[];
        };
        needles = bl.customers
          .filter((c) => c.normalized.length >= 3)
          .map((c) => ({
            canonical: c.canonical,
            pattern: new RegExp(`\\b${c.normalized.split(" ").map(escapeRegex).join("\\s+")}\\b`, "gi"),
          }));
        return needles;
      } catch {
        // ignore parse errors, fall through
      }
    }
  }
  needles = [];
  return needles;
}

/**
 * Anonimleştir + normalize edip döndür.
 * - TR karakter → ASCII
 * - Telefon → <TEL>
 * - Müşteri adı (blocklist) → <MUSTERI>
 */
export function anonymize(input: string | null | undefined): string {
  if (!input) return "";
  let text = normalizeForMatch(input);
  text = text.replace(PHONE_RE, "<tel>");
  for (const n of loadBlocklist()) text = text.replace(n.pattern, "<musteri>");
  return text;
}
