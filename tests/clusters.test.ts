import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  closeDb,
  getDb,
  upsertTickets,
  hashText,
  type LocalTicket,
} from "@/lib/ticket/local-store";
import { listClusters } from "@/lib/ticket/clusters";

let tmp: string;
let prev: string;

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), "clusters-"));
  prev = process.cwd();
  process.chdir(tmp);
  closeDb();
  getDb();
});

afterEach(() => {
  closeDb();
  process.chdir(prev);
  rmSync(tmp, { recursive: true, force: true });
});

function ticket(id: number, partial: Partial<LocalTicket> = {}): LocalTicket {
  return {
    bildirim_no: id,
    bildirim_tarihi: "2026-05-14",
    bildirim_tipi: "5. Hata",
    oncelik: "Normal",
    katman: "Backoffice",
    proje: "X",
    urun: "EnRoute",
    ana_kategori: null,
    alt_kategori: null,
    kategori_kisa: null,
    kategori_uzun: "Hata - X - Y",
    kok_neden: "Master Tanım",
    acil_ticket: null,
    support_seviye: null,
    aciklama: null,
    cozum: null,
    musteri_notu: null,
    tfs_no: null,
    tfs_durum: null,
    tfs_tip: null,
    bug_group: null,
    text_hash: hashText(`t${id}`),
    ...partial,
  };
}

describe("listClusters", () => {
  it("kok_neden bazında doğru sayar + sample id verir", () => {
    upsertTickets([
      ticket(1, { kok_neden: "A" }),
      ticket(2, { kok_neden: "A" }),
      ticket(3, { kok_neden: "B" }),
    ]);
    const c = listClusters({ groupBy: "kok_neden", lookbackDays: 30, top: 10 });
    const a = c.find((x) => x.key === "A");
    expect(a?.count).toBe(2);
    expect(a?.sampleIds.length).toBe(2);
    const b = c.find((x) => x.key === "B");
    expect(b?.count).toBe(1);
  });

  it("severity mix doğru toplar", () => {
    upsertTickets([
      ticket(1, { oncelik: "Kritik" }),
      ticket(2, { oncelik: "Yüksek" }),
      ticket(3, { oncelik: "Normal" }),
      ticket(4, { oncelik: "Normal" }),
    ]);
    const c = listClusters({ groupBy: "kok_neden", lookbackDays: 30 });
    expect(c[0]?.severityMix).toEqual({
      Normal: 2,
      Yüksek: 1,
      Kritik: 1,
      other: 0,
    });
  });

  it("boş veya NULL grupları dışlar", () => {
    upsertTickets([
      ticket(1, { kok_neden: null }),
      ticket(2, { kok_neden: "" }),
      ticket(3, { kok_neden: "Geçerli" }),
    ]);
    const c = listClusters({ groupBy: "kok_neden", lookbackDays: 30 });
    expect(c.length).toBe(1);
    expect(c[0]?.key).toBe("Geçerli");
  });
});
