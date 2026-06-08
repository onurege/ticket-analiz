import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  getDb,
  upsertTickets,
  getTicket,
  ticketCount,
  saveEmbeddings,
  loadAllVectors,
  ticketsNeedingEmbedding,
  ticketEmbeddingText,
  hashText,
  closeDb,
} from "@/lib/ticket/local-store";

let tmp: string;
let prevCwd: string;

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), "ticket-store-"));
  prevCwd = process.cwd();
  process.chdir(tmp);
  // Force re-open at new cwd
  closeDb();
  getDb();
});

afterEach(() => {
  closeDb();
  process.chdir(prevCwd);
  rmSync(tmp, { recursive: true, force: true });
});

const sample = {
  bildirim_no: 1,
  bildirim_tarihi: "2026-05-14",
  bildirim_tipi: "5. Hata",
  oncelik: "Normal",
  katman: "Backoffice",
  proje: "SUZUKI",
  urun: "EnRoute",
  ana_kategori: "Fonksiyonel Hatalar",
  alt_kategori: "Hatalı Hesaplama",
  kategori_kisa: "5.1.1.2.1 Backoffice",
  kategori_uzun: "Hata - EnRoute - Backoffice",
  kok_neden: "Master Tanım",
  acil_ticket: "Hayır",
  support_seviye: "Support L1",
  aciklama: "Rut tanımı hatası",
  cozum: "Rut kartı çıkarıldı",
  musteri_notu: null,
  tfs_no: null,
  tfs_durum: "0",
  tfs_tip: null,
  bug_group: null,
  text_hash: hashText("foo"),
};

describe("local-store", () => {
  it("upsert + getTicket çalışır", () => {
    expect(upsertTickets([sample])).toBe(1);
    expect(ticketCount()).toBe(1);
    const t = getTicket(1);
    expect(t?.proje).toBe("SUZUKI");
    expect(t?.bildirim_tipi).toBe("5. Hata");
  });

  it("upsert idempotent + text_hash güncellenir", () => {
    upsertTickets([sample]);
    const updated = { ...sample, aciklama: "yeni metin", text_hash: hashText("bar") };
    upsertTickets([updated]);
    expect(ticketCount()).toBe(1);
    expect(getTicket(1)?.text_hash).toBe(hashText("bar"));
    expect(getTicket(1)?.aciklama).toBe("yeni metin");
  });

  it("ticketsNeedingEmbedding eksikleri döner, sonra dolar", () => {
    upsertTickets([sample]);
    const model = "test-model";
    expect(ticketsNeedingEmbedding(model)).toHaveLength(1);
    saveEmbeddings(
      [{ bildirim_no: 1, text_hash: sample.text_hash, vector: [0.1, 0.2, 0.3] }],
      model,
    );
    expect(ticketsNeedingEmbedding(model)).toHaveLength(0);
  });

  it("text_hash değişirse yeniden embedding gerekir", () => {
    upsertTickets([sample]);
    const model = "test-model";
    saveEmbeddings(
      [{ bildirim_no: 1, text_hash: sample.text_hash, vector: [0.1, 0.2, 0.3] }],
      model,
    );
    upsertTickets([{ ...sample, text_hash: "differenthash" }]);
    expect(ticketsNeedingEmbedding(model)).toHaveLength(1);
  });

  it("loadAllVectors BLOB'u Float32Array olarak döner", () => {
    upsertTickets([sample]);
    const model = "test-model";
    saveEmbeddings(
      [
        {
          bildirim_no: 1,
          text_hash: sample.text_hash,
          vector: [0.5, -0.25, 0.125],
        },
      ],
      model,
    );
    const loaded = loadAllVectors(model);
    expect(loaded).toHaveLength(1);
    const v = loaded[0]!.vector;
    expect(v.length).toBe(3);
    expect(v[0]).toBeCloseTo(0.5, 5);
    expect(v[1]).toBeCloseTo(-0.25, 5);
    expect(v[2]).toBeCloseTo(0.125, 5);
  });

  it("ticketEmbeddingText boş alanları atlayıp birleştirir", () => {
    const txt = ticketEmbeddingText({
      kategori_uzun: "K",
      kok_neden: null,
      aciklama: "A",
      cozum: null,
    });
    expect(txt).toContain("KATEGORI: K");
    expect(txt).toContain("ACIKLAMA: A");
    expect(txt).not.toContain("KOK_NEDEN");
    expect(txt).not.toContain("COZUM");
  });
});
