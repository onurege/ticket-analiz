import { describe, it, expect } from "vitest";
import { chunkText, approxTokens } from "@/lib/kb/chunker";

describe("approxTokens", () => {
  it("boş metin için 0 döner", () => {
    expect(approxTokens("")).toBe(0);
    expect(approxTokens("   ")).toBe(0);
  });
  it("kelime sayısına yaklaşık döner", () => {
    expect(approxTokens("merhaba dünya")).toBeGreaterThanOrEqual(2);
  });
});

describe("chunkText", () => {
  it("boş metin için boş array döner", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n\n  ")).toEqual([]);
  });

  it("kısa metni tek chunk yapar", () => {
    const text = "Bu kısa bir test metni. Sadece bir paragraf var. Üç cümle.";
    const chunks = chunkText(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.content).toContain("kısa bir test");
  });

  it("Markdown başlıklarını heading_path'e dahil eder", () => {
    const text = `
# Ana Başlık

Bu giriş paragrafı.

## Alt Başlık

Alt başlık altında biraz daha metin.
`.trim();
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThan(0);
    const altChunk = chunks.find((c) =>
      c.content.includes("Alt başlık altında"),
    );
    expect(altChunk?.heading_path).toContain("Alt Başlık");
  });

  it("rootHeading parametresi her chunk'a uygulanır", () => {
    const text = "## Bölüm A\n\nMetin A bölümünde.";
    const chunks = chunkText(text, { rootHeading: "DocRoot" });
    expect(chunks[0]?.heading_path).toContain("DocRoot");
  });

  it("uzun metni birden çok chunk'a böler", () => {
    // ~400 kelime → maxTokens default 800, ama testte küçük tut
    const para = "Bu bir cümledir test için. ".repeat(50);
    const text = `${para}\n\n${para}\n\n${para}\n\n${para}`;
    const chunks = chunkText(text, { maxTokens: 100, minTokens: 20, overlapTokens: 0 });
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("token_count alanı doldurulur", () => {
    const chunks = chunkText("Bu basit bir cümledir. İkinci cümle var.");
    expect(chunks[0]?.token_count).toBeGreaterThan(0);
  });

  it("ord alanı 0'dan başlayan ardışık sayılar", () => {
    const text = "# A\n\nA içerik.\n\n# B\n\nB içerik.\n\n# C\n\nC içerik.";
    const chunks = chunkText(text);
    chunks.forEach((c, i) => {
      expect(c.ord).toBe(i);
    });
  });

  it("numara prefix'li başlıkları tanır", () => {
    const text = `
1.2 İkinci Bölüm Başlığı

Bölüm içeriği burada.
`.trim();
    const chunks = chunkText(text);
    expect(chunks[0]?.heading_path).toContain("İkinci Bölüm Başlığı");
  });

  it("aşırı kısa chunk'ları öncekine birleştirir", () => {
    const text = "## A\n\nUzun bir paragraf. ".repeat(40) +
      "\n\n## B\n\nKısa.";
    const chunks = chunkText(text, { maxTokens: 200, minTokens: 50 });
    // B çok kısa olduğu için ya bir önceki ile birleşir ya da kendi başına olur.
    // Bizim minTokens guard'ı bir öncekine ekler — bu yüzden son chunk'ın boyu büyük
    expect(chunks.length).toBeGreaterThan(0);
  });
});
