import { describe, it, expect } from "vitest";
import { assertSafeIdentifier, quoteIdent, qualifyTable } from "@/lib/ticket/identifiers";

describe("identifiers", () => {
  it("normal kolonları kabul eder", () => {
    expect(() => assertSafeIdentifier("Bildirim_No")).not.toThrow();
    expect(() => assertSafeIdentifier("Univera.BugGroup")).not.toThrow();
    expect(quoteIdent("dbo")).toBe("[dbo]");
    expect(quoteIdent("Univera.BugGroup")).toBe("[Univera.BugGroup]");
  });

  it.each([
    [""],
    ["1Foo"], // ilk karakter rakam
    ["foo bar"], // boşluk
    ["foo;DROP"], // noktalı virgül
    ["foo]bar"], // kapatma parantezi
    ["foo--"], // yorum başlangıcı
    ["a".repeat(65)], // çok uzun
  ])("yasaklı identifier: %s", (id) => {
    expect(() => assertSafeIdentifier(id)).toThrow(/Güvensiz SQL identifier/);
  });

  it("qualifyTable iki parçayı birleştirir", () => {
    expect(qualifyTable("dbo", "VIEW_BILDIRIM_AI_ANALIZ_DATA")).toBe(
      "[dbo].[VIEW_BILDIRIM_AI_ANALIZ_DATA]",
    );
  });
});
