/**
 * POST /api/recategorize
 *
 * Cache'deki TÜM ticket'ları yeniden kategorize eder.
 * Kural değiştiğinde veya kategori hatası bulduğunda manuel tetikle.
 *
 * Döndürür:
 *   - total: kaç ticket işlendi
 *   - changed: kaç ticket'ın bir kategorisi değişti
 *   - diff: alan başına değişiklik sayısı + 10 örnek
 *
 * Opsiyonel: ?include_refresh=true → önce MSSQL'den yeni ticket'lar çek.
 */
import type { FastifyInstance } from "fastify";
import { getDb } from "../db/cache.js";
import { categorize } from "../categorizer/rules.js";
import { runOnce } from "../ingestor/index.js";

type CacheRow = {
  bildirim_no: number;
  cozum_text: string;
  is_sureci: string | null;
  islem_tipi: string | null;
  etkilenen_nesne: string | null;
  etki: string | null;
  kok_neden_grup: string | null;
  kok_neden_detay: string | null;
  cozum_tipi: string | null;
};

type Diff = { bildirimNo: number; field: string; from: string | null; to: string };

export function registerRecategorizeRoutes(app: FastifyInstance): void {
  app.post<{ Querystring: { include_refresh?: string } }>("/api/recategorize", async (req) => {
    const includeRefresh = req.query.include_refresh === "true";

    // Önce yeni ticket'ları çek (opsiyonel)
    let fetched = 0;
    if (includeRefresh) {
      fetched = await runOnce({ force: false });
    }

    const db = getDb();
    // Manuel kategorize edilen satırları KORU (reason='manual-v1') — sadece
    // rule-based ve eski v1'leri yeniden işle.
    const rows = db
      .prepare(`
        SELECT bildirim_no, cozum_text, is_sureci, islem_tipi, etkilenen_nesne,
               etki, kok_neden_grup, kok_neden_detay, cozum_tipi
        FROM tickets
        WHERE cozum_text IS NOT NULL
          AND COALESCE(reason, '') != 'manual-v1'
      `)
      .all() as CacheRow[];

    const stmt = db.prepare(`
      UPDATE tickets SET
        is_sureci = @isSureci,
        islem_tipi = @islemTipi,
        etkilenen_nesne = @etkilenenNesne,
        etki = @etki,
        kok_neden_grup = @kokNedenGrup,
        kok_neden_detay = @kokNedenDetay,
        cozum_tipi = @cozumTipi,
        confidence = 0.85,
        reason = 'rule-based v2',
        categorized_at = @categorizedAt
      WHERE bildirim_no = @bildirimNo
    `);

    const now = new Date().toISOString();
    const diffByField: Record<string, number> = {
      is_sureci: 0,
      islem_tipi: 0,
      etkilenen_nesne: 0,
      etki: 0,
      kok_neden_grup: 0,
      kok_neden_detay: 0,
      cozum_tipi: 0,
    };
    const sampleDiffs: Diff[] = [];
    let totalChanged = 0;

    const tx = db.transaction((items: CacheRow[]) => {
      for (const r of items) {
        const t = categorize(r.cozum_text);
        const changes: Diff[] = [];

        // Field-by-field karşılaştırma
        if (r.is_sureci !== t.isSureci) { diffByField.is_sureci++; changes.push({ bildirimNo: r.bildirim_no, field: "is_sureci", from: r.is_sureci, to: t.isSureci }); }
        if (r.islem_tipi !== t.islemTipi) { diffByField.islem_tipi++; changes.push({ bildirimNo: r.bildirim_no, field: "islem_tipi", from: r.islem_tipi, to: t.islemTipi }); }
        if (r.etkilenen_nesne !== t.etkilenenNesne) { diffByField.etkilenen_nesne++; changes.push({ bildirimNo: r.bildirim_no, field: "etkilenen_nesne", from: r.etkilenen_nesne, to: t.etkilenenNesne }); }
        if (r.etki !== t.etki) { diffByField.etki++; changes.push({ bildirimNo: r.bildirim_no, field: "etki", from: r.etki, to: t.etki }); }
        if (r.kok_neden_grup !== t.kokNedenGrup) { diffByField.kok_neden_grup++; changes.push({ bildirimNo: r.bildirim_no, field: "kok_neden_grup", from: r.kok_neden_grup, to: t.kokNedenGrup }); }
        if (r.kok_neden_detay !== t.kokNedenDetay) { diffByField.kok_neden_detay++; changes.push({ bildirimNo: r.bildirim_no, field: "kok_neden_detay", from: r.kok_neden_detay, to: t.kokNedenDetay }); }
        if (r.cozum_tipi !== t.cozumTipi) { diffByField.cozum_tipi++; changes.push({ bildirimNo: r.bildirim_no, field: "cozum_tipi", from: r.cozum_tipi, to: t.cozumTipi }); }

        if (changes.length > 0) {
          totalChanged++;
          if (sampleDiffs.length < 30) sampleDiffs.push(...changes);
        }

        stmt.run({
          bildirimNo: r.bildirim_no,
          isSureci: t.isSureci,
          islemTipi: t.islemTipi,
          etkilenenNesne: t.etkilenenNesne,
          etki: t.etki,
          kokNedenGrup: t.kokNedenGrup,
          kokNedenDetay: t.kokNedenDetay,
          cozumTipi: t.cozumTipi,
          categorizedAt: now,
        });
      }
    });

    tx(rows);

    return {
      ok: true,
      total: rows.length,
      changed: totalChanged,
      unchanged: rows.length - totalChanged,
      diffByField,
      sampleDiffs: sampleDiffs.slice(0, 30),
      refresh: includeRefresh ? { fetched } : undefined,
    };
  });
}
