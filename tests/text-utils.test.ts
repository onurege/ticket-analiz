import { describe, it, expect } from "vitest";
import {
  trLower,
  asciiFold,
  tokenize,
  tokenizeStemmed,
  splitSentences,
  jaccard,
  topNGrams,
} from "@/lib/ticket/text-utils";

describe("text-utils", () => {
  it("trLower TR büyük harfleri doğru çevirir", () => {
    expect(trLower("İSTANBUL")).toBe("istanbul");
    expect(trLower("IĞDIR")).toBe("ığdır");
  });

  it("asciiFold TR karakterleri ASCII'leştirir", () => {
    expect(asciiFold("şöğüç")).toBe("sogüc".replace("ü", "u"));
    expect(asciiFold("İstanbul")).toBe("istanbul");
  });

  it("tokenize stopword'leri ve kısa token'ları atar", () => {
    const toks = tokenize("Müşteri kartını için ve bu rut tanımı");
    expect(toks).toContain("musteri");
    expect(toks).toContain("kartini");
    expect(toks).toContain("rut");
    expect(toks).toContain("tanimi");
    expect(toks).not.toContain("için");
    expect(toks).not.toContain("ve");
    expect(toks).not.toContain("bu");
  });

  it("splitSentences temel TR cümleleri böler", () => {
    const text = "Müşteri pasif. Tekrar aktifleştirildi. Sorun çözüldü.";
    const ss = splitSentences(text);
    expect(ss.length).toBe(3);
    expect(ss[0]).toContain("Müşteri pasif");
  });

  it("jaccard benzer cümleleri yüksek skorlar (stem ile)", () => {
    const a = tokenizeStemmed("Rut kartı satış temsilcisinden çıkarıldı");
    const b = tokenizeStemmed("Satış temsilcisi rut kartından çıkarıldı");
    expect(jaccard(a, b)).toBeGreaterThan(0.5);
  });

  it("jaccard alakasız cümlelere düşük skor verir", () => {
    const a = tokenize("rut tanımı yapıldı");
    const b = tokenize("yazıcı bağlantısı bluetooth ayarı");
    expect(jaccard(a, b)).toBeLessThan(0.2);
  });

  it("topNGrams tekrar eden ifadeleri yakalar", () => {
    const texts = [
      "Rut tanımı yapıldı, müşteri eklendi.",
      "Rut tanımı kontrol edildi.",
      "Müşteri rut tanımı yapıldı.",
    ];
    const grams = topNGrams(texts, 5, 2);
    const phrases = grams.map((g) => g.phrase);
    // "rut tanimi" 3 metinde geçer
    expect(phrases.some((p) => p.includes("rut") && p.includes("tanimi"))).toBe(true);
  });
});
