/**
 * GET /api/stats/v1
 *
 * Eski taxonomy ile dashboard verisi.
 * Veri kaynağı: data/snapshot-v1.json (kategorize) + cache.sqlite (tarih, operatör, çözüm uzunluğu).
 *
 * v3 (yeni) snapshot'tan platform/self_servis dönmez — sadece v2 (eski) taxonomy.
 */
import type { FastifyInstance } from "fastify";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { getDb } from "../db/cache.js";
import { computePareto } from "../lib/pareto.js";

type V1Snapshot = {
  bildirim_no: number;
  is_sureci: string;
  islem_tipi: string;
  etkilenen_nesne: string;
  etki: string;
  kok_neden_grup: string;
  kok_neden_detay: string;
  cozum_tipi: string;
};

type Meta = {
  bildirim_no: number;
  gdt: string;
  kullanici: string | null;
  cozum_len: number;
};

let cached: V1Snapshot[] | null = null;
function loadSnapshot(): V1Snapshot[] {
  if (cached) return cached;
  const path = resolve(process.cwd(), "./data/snapshot-v1.json");
  if (!existsSync(path)) {
    cached = [];
    return cached;
  }
  cached = JSON.parse(readFileSync(path, "utf8")) as V1Snapshot[];
  return cached;
}

function count(arr: V1Snapshot[], field: keyof V1Snapshot): Record<string, number> {
  const c: Record<string, number> = {};
  for (const r of arr) {
    const v = r[field] as string | undefined;
    if (!v) continue;
    c[v] = (c[v] ?? 0) + 1;
  }
  // Sort by count desc
  return Object.fromEntries(Object.entries(c).sort((a, b) => b[1] - a[1]));
}

export function registerStatsV1Routes(app: FastifyInstance): void {
  app.get("/api/stats/v1", async () => {
    const snapshot = loadSnapshot();
    const db = getDb();

    // Cache'den metadata (tarih, operatör, çözüm uzunluğu) — JOIN için
    const metaRows = db.prepare(`
      SELECT bildirim_no, gdt, kullanici, cozum_len
      FROM tickets
    `).all() as Meta[];
    const metaByBid = new Map(metaRows.map((m) => [m.bildirim_no, m]));

    // Snapshot ile cache'de olanların kesişimini al
    const rows = snapshot.filter((r) => metaByBid.has(r.bildirim_no));

    if (rows.length === 0) {
      return { error: "v1 snapshot boş veya cache'le eşleşmiyor" };
    }

    const isSureci = count(rows, "is_sureci");
    const islemTipi = count(rows, "islem_tipi");
    const etkilenenNesne = count(rows, "etkilenen_nesne");
    const etki = count(rows, "etki");
    const kokNedenGrup = count(rows, "kok_neden_grup");
    const kokNedenDetay = count(rows, "kok_neden_detay");
    const cozumTipi = count(rows, "cozum_tipi");

    // Daily — cache'den tarih
    const daily: Record<string, number> = {};
    const minDateRef = { v: "9999-12-31" };
    const maxDateRef = { v: "0000-00-00" };
    for (const r of rows) {
      const m = metaByBid.get(r.bildirim_no);
      if (!m) continue;
      const d = m.gdt.slice(0, 10);
      daily[d] = (daily[d] ?? 0) + 1;
      if (d < minDateRef.v) minDateRef.v = d;
      if (d > maxDateRef.v) maxDateRef.v = d;
    }
    const sortedDaily = Object.fromEntries(Object.entries(daily).sort());

    // Operator stats
    const opCount: Record<string, number> = {};
    const opTotalChars: Record<string, number> = {};
    for (const r of rows) {
      const m = metaByBid.get(r.bildirim_no);
      if (!m || !m.kullanici) continue;
      opCount[m.kullanici] = (opCount[m.kullanici] ?? 0) + 1;
      opTotalChars[m.kullanici] = (opTotalChars[m.kullanici] ?? 0) + (m.cozum_len ?? 0);
    }
    const opAvgChars: Record<string, number> = {};
    for (const k of Object.keys(opCount)) {
      opAvgChars[k] = Math.round(opTotalChars[k] / opCount[k]);
    }

    // Cross-tab kök neden × çözüm
    const xtab: Record<string, Record<string, number>> = {};
    for (const r of rows) {
      if (!r.kok_neden_grup || !r.cozum_tipi) continue;
      if (!xtab[r.kok_neden_grup]) xtab[r.kok_neden_grup] = {};
      xtab[r.kok_neden_grup][r.cozum_tipi] = (xtab[r.kok_neden_grup][r.cozum_tipi] ?? 0) + 1;
    }

    const total = rows.length;
    const sumByPrefix = (obj: Record<string, number>, ...prefixes: string[]) =>
      Object.entries(obj)
        .filter(([k]) => prefixes.some((p) => k.startsWith(p) || k.includes(p)))
        .reduce((sum, [, n]) => sum + n, 0);

    const kritik = etki["İş tamamen durdu"] ?? 0;
    const egitim = sumByPrefix(kokNedenGrup, "Kullanım/Eğitim", "Kullanım / Eğitim");
    const ebelge = sumByPrefix(isSureci, "E-Belge");
    const manuel =
      sumByPrefix(cozumTipi, "Bilgilendirme") +
      sumByPrefix(cozumTipi, "Veri/kart düzeltme", "Veri / kart düzeltme") +
      sumByPrefix(cozumTipi, "Parametre düzeltme");

    return {
      version: "v1",
      totals: {
        ticket: total,
        operator: Object.keys(opCount).length,
        kritikDurduran: kritik,
        egitimKaynakli: egitim,
        manuelMudahale: manuel,
        ebelgeYuzde: total > 0 ? Math.round((ebelge / total) * 100) : 0,
        selfServisYuzde: 0, // v1'de yok
      },
      dateRange: { from: minDateRef.v, to: maxDateRef.v },
      isSureci,
      islemTipi,
      etkilenenNesne,
      etki,
      kokNedenGrup,
      kokNedenDetay,
      cozumTipi,
      platform: {}, // v1'de yok
      selfServis: {}, // v1'de yok
      operatorCount: opCount,
      operatorAvgChars: opAvgChars,
      daily: sortedDaily,
      xtab,
      paretoDetay: computePareto(kokNedenDetay, 15),
      paretoGrup: computePareto(kokNedenGrup, 12),
    };
  });
}
