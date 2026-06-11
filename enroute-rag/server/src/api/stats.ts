/**
 * /api/stats — dashboard agregat veriler.
 */
import type { FastifyInstance } from "fastify";
import { getDb } from "../db/cache.js";
import { computePareto } from "../lib/pareto.js";

function counts(col: string): Record<string, number> {
  const rows = getDb()
    .prepare(
      `SELECT ${col} AS k, COUNT(*) AS n FROM tickets WHERE ${col} IS NOT NULL GROUP BY ${col} ORDER BY n DESC`,
    )
    .all() as { k: string; n: number }[];
  return Object.fromEntries(rows.map((r) => [r.k, r.n]));
}

function dailyCounts(): Record<string, number> {
  const rows = getDb()
    .prepare(
      "SELECT substr(gdt,1,10) AS d, COUNT(*) AS n FROM tickets GROUP BY substr(gdt,1,10) ORDER BY d ASC",
    )
    .all() as { d: string; n: number }[];
  return Object.fromEntries(rows.map((r) => [r.d, r.n]));
}

export async function getStatsResponse(): Promise<unknown> {
    const db = getDb();

    const totalRow = db.prepare("SELECT COUNT(*) AS n, MIN(gdt) AS minD, MAX(gdt) AS maxD FROM tickets").get() as {
      n: number;
      minD: string | null;
      maxD: string | null;
    };

    const opAvgRows = db
      .prepare(
        "SELECT kullanici AS k, COUNT(*) AS n, ROUND(AVG(cozum_len)) AS avgChars FROM tickets WHERE kullanici IS NOT NULL GROUP BY kullanici ORDER BY n DESC",
      )
      .all() as { k: string; n: number; avgChars: number }[];

    const isSureci = counts("is_sureci");
    const islemTipi = counts("islem_tipi");
    const etkilenenNesne = counts("etkilenen_nesne");
    const etki = counts("etki");
    const kokNedenGrup = counts("kok_neden_grup");
    const kokNedenDetay = counts("kok_neden_detay");
    const cozumTipi = counts("cozum_tipi");
    const platform = counts("platform");
    const selfServis = counts("self_servis");

    // Cross-tab kök neden grup × çözüm tipi
    const xtRows = db
      .prepare(
        "SELECT kok_neden_grup AS g, cozum_tipi AS c, COUNT(*) AS n FROM tickets WHERE kok_neden_grup IS NOT NULL AND cozum_tipi IS NOT NULL GROUP BY kok_neden_grup, cozum_tipi",
      )
      .all() as { g: string; c: string; n: number }[];
    const xtab: Record<string, Record<string, number>> = {};
    for (const r of xtRows) {
      if (!xtab[r.g]) xtab[r.g] = {};
      xtab[r.g][r.c] = r.n;
    }

    const total = totalRow.n;
    const kritik = etki["İş tamamen durdu"] ?? 0;

    // Prefix-match: hem eski ("Kullanım/Eğitim") hem yeni ("Kullanım / Eğitim") taxonomy
    const sumByPrefix = (obj: Record<string, number>, ...prefixes: string[]) =>
      Object.entries(obj)
        .filter(([k]) => prefixes.some((p) => k.startsWith(p) || k.includes(p)))
        .reduce((sum, [, n]) => sum + n, 0);

    const egitim = sumByPrefix(kokNedenGrup, "Kullanım/Eğitim", "Kullanım / Eğitim");
    const ebelge = sumByPrefix(isSureci, "E-Belge");
    const manuel =
      sumByPrefix(cozumTipi, "Bilgilendirme") +
      sumByPrefix(cozumTipi, "Veri/kart düzeltme", "Veri / kart düzeltme") +
      sumByPrefix(cozumTipi, "Parametre düzeltme");

    // Self-servis mümkün olan yüzde (operatör müdahalesi gereksiz olabilecekler)
    const selfServisToplam = Object.values(selfServis).reduce((a, b) => a + b, 0);
    const selfServisEvet = sumByPrefix(selfServis, "Evet");
    const selfServisKismi = sumByPrefix(selfServis, "Kısmi");
    const selfServisYuzde = selfServisToplam > 0
      ? Math.round(((selfServisEvet + selfServisKismi) / selfServisToplam) * 100)
      : 0;

    return {
      totals: {
        ticket: total,
        operator: opAvgRows.length,
        kritikDurduran: kritik,
        egitimKaynakli: egitim,
        manuelMudahale: manuel,
        ebelgeYuzde: total > 0 ? Math.round((ebelge / total) * 100) : 0,
        selfServisYuzde,
      },
      dateRange: { from: totalRow.minD?.slice(0, 10), to: totalRow.maxD?.slice(0, 10) },
      isSureci,
      islemTipi,
      etkilenenNesne,
      etki,
      kokNedenGrup,
      kokNedenDetay,
      cozumTipi,
      platform,
      selfServis,
      operatorCount: Object.fromEntries(opAvgRows.map((r) => [r.k, r.n])),
      operatorAvgChars: Object.fromEntries(opAvgRows.map((r) => [r.k, r.avgChars])),
      daily: dailyCounts(),
      xtab,
      paretoDetay: computePareto(kokNedenDetay, 15),
      paretoGrup: computePareto(kokNedenGrup, 12),
    };
}

export function registerStatsRoutes(app: FastifyInstance): void {
  app.get("/api/stats", async () => getStatsResponse());
}
