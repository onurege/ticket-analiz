import { describe, it, expect } from "vitest";
import { buildUserPrompt, SYSTEM_INSTRUCTION } from "@/lib/ticket/prompts";
import type { Taxonomy } from "@/lib/ticket/taxonomy";
import type { LocalTicket } from "@/lib/ticket/local-store";

const taxonomy: Taxonomy = {
  tipler: ["5. Hata", "2. Talep"],
  oncelikler: ["Normal", "Yüksek", "Kritik"],
  katmanlar: ["Backoffice", "Mobile"],
  kokNedenler: ["Master Tanım", "Veri tutarsızlığı"],
  bugGroups: ["EnRoute.Calculation"],
  tfsTipler: ["Bug"],
};

const matched: LocalTicket = {
  bildirim_no: 1,
  bildirim_tarihi: "2026-05-14",
  bildirim_tipi: "5. Hata",
  oncelik: "Normal",
  katman: "Backoffice",
  proje: "SUZUKI",
  urun: "EnRoute",
  ana_kategori: "Fonksiyonel",
  alt_kategori: "Hesaplama",
  kategori_kisa: "5.1",
  kategori_uzun: "Hata - EnRoute - Backoffice",
  kok_neden: "Master Tanım",
  acil_ticket: "Hayır",
  support_seviye: "L1",
  aciklama: "Rut tanımında hata var.",
  cozum: "Rut kartı çıkarıldı.",
  musteri_notu: null,
  tfs_no: null,
  tfs_durum: "0",
  tfs_tip: null,
  bug_group: null,
  text_hash: "h",
};

describe("buildUserPrompt", () => {
  it("BILDIRIM_NO modu — matched bilgilerini yerleştirir, freeText yok", () => {
    const p = buildUserPrompt({
      freeText: null,
      matched,
      similar: [],
      taxonomy,
    });
    expect(p).toContain("MOD: BILDIRIM_NO");
    expect(p).toContain("Bildirim_No   : 1");
    expect(p).toContain("Proje         : SUZUKI");
    expect(p).not.toContain("Kullanıcının Yazdığı Sorun");
  });

  it("SERBEST_METIN modu — matched=null + freeText var", () => {
    const p = buildUserPrompt({
      freeText: "Müşteri yeni temsilciye rut atayamıyor.",
      matched: null,
      similar: [],
      taxonomy,
    });
    expect(p).toContain("MOD: SERBEST_METIN");
    expect(p).toContain("Kullanıcının Yazdığı Sorun");
    expect(p).toContain("rut atayamıyor");
  });

  it("benzer kayıtları skor + içerikle birlikte yerleştirir", () => {
    const p = buildUserPrompt({
      freeText: "x",
      matched: null,
      similar: [
        {
          bildirim_no: 99,
          score: 0.812,
          proje: "MEY",
          kategori_uzun: "Talep - EnRoute",
          kok_neden: "Master",
          aciklama: "açıklama",
          cozum: "uygulanan çözüm",
          tfs_tip: null,
          bug_group: null,
        },
      ],
      taxonomy,
    });
    expect(p).toMatch(/\[1\].*#99/);
    expect(p).toContain("skor=0.812");
    expect(p).toContain("uygulanan çözüm");
  });

  it("taksonomi alt küme limitlerine uyar", () => {
    const big: Taxonomy = {
      tipler: Array.from({ length: 20 }, (_, i) => `T${i}`),
      oncelikler: ["Normal", "Yüksek"],
      katmanlar: ["X"],
      kokNedenler: Array.from({ length: 100 }, (_, i) => `KN${i}`),
      bugGroups: [],
      tfsTipler: [],
    };
    const p = buildUserPrompt({ freeText: "x", matched: null, similar: [], taxonomy: big });
    // tipler 8 ile limitli
    expect(p).toContain("T0 | T1 | T2 | T3 | T4 | T5 | T6 | T7");
    expect(p).not.toContain("T8");
  });

  it("SYSTEM_INSTRUCTION Türkçe ve JSON zorunluluğu içerir", () => {
    expect(SYSTEM_INSTRUCTION).toContain("Türkçe");
    expect(SYSTEM_INSTRUCTION).toContain("JSON");
  });
});
