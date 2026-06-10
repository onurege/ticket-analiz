/**
 * /api/tickets — liste + detay.
 */
import type { FastifyInstance } from "fastify";
import { getDb } from "../db/cache.js";

const ALLOWED_FILTERS = new Set([
  "is_sureci",
  "islem_tipi",
  "etkilenen_nesne",
  "etki",
  "kok_neden_grup",
  "kok_neden_detay",
  "cozum_tipi",
  "platform",
  "self_servis",
  "kullanici",
]);

type TicketListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  is_sureci?: string;
  islem_tipi?: string;
  etkilenen_nesne?: string;
  etki?: string;
  kok_neden_grup?: string;
  kok_neden_detay?: string;
  cozum_tipi?: string;
  platform?: string;
  self_servis?: string;
  kullanici?: string;
};

export function registerTicketRoutes(app: FastifyInstance): void {
  // Liste
  app.get<{ Querystring: TicketListQuery }>("/api/tickets", async (req) => {
    const q = req.query;
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(200, Math.max(1, Number(q.limit ?? 30)));
    const offset = (page - 1) * limit;

    const where: string[] = [];
    const params: Record<string, string> = {};

    for (const key of ALLOWED_FILTERS) {
      const v = q[key as keyof TicketListQuery];
      if (typeof v === "string" && v.length > 0) {
        where.push(`${key} = @${key}`);
        params[key] = v;
      }
    }
    if (q.search && q.search.length >= 2) {
      where.push("cozum_text LIKE @search");
      params.search = `%${q.search.toLowerCase()}%`;
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const total = (
      getDb()
        .prepare(`SELECT COUNT(*) AS n FROM tickets ${whereSql}`)
        .get(params) as { n: number }
    ).n;

    const rows = getDb()
      .prepare(
        `SELECT
           bildirim_no AS bildirimNo,
           kullanici,
           gdt,
           SUBSTR(cozum_text, 1, 200) AS preview,
           cozum_len AS cozumLen,
           is_sureci AS isSureci,
           islem_tipi AS islemTipi,
           etkilenen_nesne AS etkilenenNesne,
           etki,
           kok_neden_grup AS kokNedenGrup,
           kok_neden_detay AS kokNedenDetay,
           cozum_tipi AS cozumTipi
         FROM tickets
         ${whereSql}
         ORDER BY gdt DESC
         LIMIT @limit OFFSET @offset`,
      )
      .all({ ...params, limit, offset });

    return {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      items: rows,
    };
  });

  // Detay
  app.get<{ Params: { id: string } }>("/api/tickets/:id", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      reply.code(400);
      return { error: "Geçersiz id" };
    }
    const row = getDb()
      .prepare(
        `SELECT
           bildirim_no AS bildirimNo,
           kullanici,
           gdt,
           musteri_sorunu AS musteriSorunu,
           tespit_sorun AS tespitSorun,
           cozum_text AS cozumText,
           cozum_len AS cozumLen,
           is_sureci AS isSureci,
           islem_tipi AS islemTipi,
           etkilenen_nesne AS etkilenenNesne,
           etki,
           kok_neden_grup AS kokNedenGrup,
           kok_neden_detay AS kokNedenDetay,
           cozum_tipi AS cozumTipi,
           platform,
           self_servis AS selfServis,
           confidence,
           reason,
           categorized_at AS categorizedAt
         FROM tickets WHERE bildirim_no = @id`,
      )
      .get({ id });
    if (!row) {
      reply.code(404);
      return { error: "Ticket bulunamadı" };
    }

    // Operatörün toplam ticket sayısı (context için)
    const op = (row as { kullanici: string | null }).kullanici;
    let opStats: { tickets: number; avgChars: number } | null = null;
    if (op) {
      const r = getDb()
        .prepare(
          "SELECT COUNT(*) AS tickets, ROUND(AVG(cozum_len)) AS avgChars FROM tickets WHERE kullanici = @op",
        )
        .get({ op }) as { tickets: number; avgChars: number };
      opStats = r;
    }

    return { ticket: row, operatorStats: opStats };
  });
}
