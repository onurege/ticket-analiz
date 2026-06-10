/**
 * N4B MSSQL bağlantısı.
 * TBL_N4B_COZUM_ACIKLAMALAR'dan incremental fetch.
 */
import sql from "mssql";
import { config } from "../config.js";

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (poolPromise) return poolPromise;
  poolPromise = new sql.ConnectionPool({
    server: config.mssql.server,
    port: config.mssql.port,
    database: config.mssql.database,
    user: config.mssql.user,
    password: config.mssql.password,
    options: {
      instanceName: config.mssql.instance,
      encrypt: config.mssql.encrypt,
      trustServerCertificate: config.mssql.trustServerCertificate,
      enableArithAbort: true,
    },
    pool: { max: 4, min: 0, idleTimeoutMillis: 30_000 },
    connectionTimeout: 30_000,
    requestTimeout: 60_000,
  }).connect();
  return poolPromise;
}

export type N4BRow = {
  bildirimNo: number;
  kullanici: string | null;
  gdt: string; // ISO
  musteriSorunu: string | null;
  tespitSorun: string | null;
  cozumText: string | null;
};

/**
 * Belirli bir tarihten sonraki kayıtları çek.
 * Müşteri tarafı (TXTMUSTERISORUNU), operatör tespiti (TXTTESPITEDILENSORUN)
 * ve çözüm (TXTCOZUMACIKLAMA) — üçü birlikte categorize için kullanılır.
 *
 * @param since ISO datetime string (e.g. "2026-05-01T00:00:00")
 */
export async function fetchSince(since: string): Promise<N4BRow[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("since", sql.DateTime2, since)
    .query<{
      BILDIRIMNO: number;
      TXTKULLANICI: string | null;
      GDT: Date;
      TXTMUSTERISORUNU: string | null;
      TXTTESPITEDILENSORUN: string | null;
      TXTCOZUMACIKLAMA: string | null;
    }>(`
      SELECT
        BILDIRIMNO,
        TXTKULLANICI,
        GDT,
        TXTMUSTERISORUNU,
        TXTTESPITEDILENSORUN,
        TXTCOZUMACIKLAMA
      FROM TBL_N4B_COZUM_ACIKLAMALAR
      WHERE GDT > @since
      ORDER BY GDT ASC
    `);
  return result.recordset.map((r) => ({
    bildirimNo: r.BILDIRIMNO,
    kullanici: r.TXTKULLANICI,
    gdt: r.GDT.toISOString(),
    musteriSorunu: r.TXTMUSTERISORUNU,
    tespitSorun: r.TXTTESPITEDILENSORUN,
    cozumText: r.TXTCOZUMACIKLAMA,
  }));
}

export async function ping(): Promise<{ ok: boolean; latencyMs: number; err?: string }> {
  const t0 = Date.now();
  try {
    const pool = await getPool();
    await pool.request().query("SELECT 1 AS ok");
    return { ok: true, latencyMs: Date.now() - t0 };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - t0, err: (e as Error).message };
  }
}

export async function close(): Promise<void> {
  if (poolPromise) {
    const p = await poolPromise;
    await p.close();
    poolPromise = null;
  }
}
