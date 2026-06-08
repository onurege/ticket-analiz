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
import { deterministicSynthesize } from "@/lib/ticket/synthesizer";

let tmp: string;
let prev: string;

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), "synth-det-"));
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
    proje: "SUZUKI",
    urun: "EnRoute",
    ana_kategori: null,
    alt_kategori: null,
    kategori_kisa: null,
    kategori_uzun: "Hata - X - Y",
    kok_neden: "Master Tanım",
    acil_ticket: null,
    support_seviye: null,
    aciklama: "Rut tanımı yapılamıyor",
    cozum: "Rut kartı satış temsilcisinden çıkarıldı, sorun çözüldü.",
    musteri_notu: null,
    tfs_no: null,
    tfs_durum: null,
    tfs_tip: null,
    bug_group: null,
    text_hash: hashText(`t${id}`),
    ...partial,
  };
}

describe("deterministicSynthesize", () => {
  it("aynı çözüm cümlesi birden çok kez geçince kanonik adıma çevirir", () => {
    const tickets = [
      ticket(1, { cozum: "Rut kartı satış temsilcisinden çıkarıldı." }),
      ticket(2, { cozum: "Satış temsilcisi rut kartından çıkarıldı." }),
      ticket(3, { cozum: "Rut kartı satış temsilcisinden çıkarıldı." }),
    ];
    upsertTickets(tickets);
    const out = deterministicSynthesize({
      groupBy: "kok_neden",
      groupKey: "Master Tanım",
      tickets,
      totalInGroup: 3,
    });
    expect(out.canonicalSolution.length).toBeGreaterThanOrEqual(1);
    // 3 ticket'ta gözlendiğini evidence içinde belirtir
    expect(out.canonicalSolution[0]?.evidence).toContain("kayıtta gözlendi");
  });

  it("title olarak groupKey'i kullanır, açıklamada totalInGroup ve proje listesi var", () => {
    const tickets = [ticket(1), ticket(2, { proje: "MEY" }), ticket(3, { proje: "JTI" })];
    upsertTickets(tickets);
    const out = deterministicSynthesize({
      groupBy: "kok_neden",
      groupKey: "Master Tanım",
      tickets,
      totalInGroup: 50,
    });
    expect(out.pattern.title).toBe("Master Tanım");
    expect(out.pattern.description).toContain("50");
    expect(out.pattern.description.toUpperCase()).toContain("SUZUKI");
  });

  it("commonRootCause groupBy=kok_neden ise groupKey'in kendisi olur", () => {
    const tickets = [ticket(1), ticket(2)];
    upsertTickets(tickets);
    const out = deterministicSynthesize({
      groupBy: "kok_neden",
      groupKey: "Master Tanım",
      tickets,
      totalInGroup: 2,
    });
    expect(out.commonRootCause).toBe("Master Tanım");
  });

  it("LLM yok — coverageNote 'deterministik' kelimesini içerir", () => {
    const tickets = [ticket(1)];
    upsertTickets(tickets);
    const out = deterministicSynthesize({
      groupBy: "kok_neden",
      groupKey: "Master Tanım",
      tickets,
      totalInGroup: 1,
    });
    expect(out.coverageNote).toContain("deterministik");
  });

  it("boilerplate cümleleri kanonik çözüme almaz", () => {
    const tickets = [
      ticket(1, { cozum: "İşlem yapılıp bilgi verildi." }),
      ticket(2, { cozum: "İşlem yapılıp bilgi verildi." }),
      ticket(3, { cozum: "Müşteriye konu hakkında bilgi verildi." }),
      ticket(4, { cozum: "Tekrar kontrol edebilirsiniz." }),
      ticket(5, { cozum: "Sorun çözüldü." }),
      ticket(6, { cozum: "Operatöre yönlendirildi." }),
    ];
    upsertTickets(tickets);
    const out = deterministicSynthesize({
      groupBy: "kok_neden",
      groupKey: "Master Tanım",
      tickets,
      totalInGroup: 6,
    });
    // Hepsi boilerplate — kanonik çözüm listesi boş olmalı
    expect(out.canonicalSolution.length).toBe(0);
  });

  it("içerik dolu cümleleri kabul eder, boilerplate'i atar", () => {
    const detailed =
      "Aktif olarak kullanılan Satış Temsilcisi kartının içerisinden ilgili rut çıkarıldı.";
    const tickets = [
      ticket(1, { cozum: detailed }),
      ticket(2, { cozum: detailed }),
      ticket(3, { cozum: "Sorun giderildi." }), // boilerplate
      ticket(4, { cozum: "Çözümlenmiştir." }), // boilerplate
    ];
    upsertTickets(tickets);
    const out = deterministicSynthesize({
      groupBy: "kok_neden",
      groupKey: "Master Tanım",
      tickets,
      totalInGroup: 4,
    });
    expect(out.canonicalSolution.length).toBe(1);
    expect(out.canonicalSolution[0]?.step).toContain("Satış Temsilcisi");
  });

  it("varyant sub-aggregation ile çıkarılır", () => {
    const tickets = [
      ticket(1, { kategori_uzun: "Hata - A" }),
      ticket(2, { kategori_uzun: "Hata - A" }),
      ticket(3, { kategori_uzun: "Hata - B" }),
      ticket(4, { kategori_uzun: "Hata - B" }),
    ];
    upsertTickets(tickets);
    const out = deterministicSynthesize({
      groupBy: "kok_neden",
      groupKey: "Master Tanım",
      tickets,
      totalInGroup: 4,
    });
    expect(out.variants.length).toBe(2);
    expect(out.variants.map((v) => v.title).sort()).toEqual(["Hata - A", "Hata - B"]);
  });
});
