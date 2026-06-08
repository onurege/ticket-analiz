import { describe, it, expect } from "vitest";
import { redact } from "@/lib/ticket/redactor";

describe("redact", () => {
  it("e-postayı maskeler", () => {
    const r = redact("Müşteri: ahmet@univera.com.tr yazdı");
    expect(r.text).toBe("Müşteri: <EMAIL> yazdı");
    expect(r.redactions[0]?.kind).toBe("email");
  });

  it("IBAN'ı maskeler", () => {
    const r = redact("Hesap: TR12 0001 0019 1234 5678 9012 34 lütfen");
    expect(r.text).toContain("<IBAN>");
  });

  it("telefon numarasını maskeler", () => {
    expect(redact("Arayan: 0532 123 45 67").text).toContain("<TEL>");
    expect(redact("Arayan: +90 532 123 45 67").text).toContain("<TEL>");
  });

  it("TCKN benzeri 11 haneyi maskeler", () => {
    expect(redact("TC: 12345678901 bu kişi").text).toContain("<TCKN>");
  });

  it("kart benzeri uzun sayıları maskeler", () => {
    expect(redact("Kart: 4242 4242 4242 4242").text).toContain("<CARD>");
  });

  it("null/undefined için boş döner", () => {
    expect(redact(null).text).toBe("");
    expect(redact(undefined).redactions).toEqual([]);
  });

  it("temiz metni dokunmadan döndürür", () => {
    const text = "Rut tanımı sırasında hata aldık, çıktı alınamıyor.";
    expect(redact(text).text).toBe(text);
  });
});
