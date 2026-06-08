import { describe, it, expect } from "vitest";
import {
  getByIdQuery,
  recentQuery,
  distinctValuesQuery,
} from "@/lib/ticket/query-builder";
import { assertReadOnly } from "@/lib/db";

describe("query-builder", () => {
  it("getByIdQuery — parametre bind + TOP 1 + guard'dan geçer", () => {
    const q = getByIdQuery(32511772);
    expect(q.text).toMatch(/SELECT\s+TOP\s+1/);
    expect(q.text).toMatch(/\[Bildirim_No\]\s*=\s*@id/);
    expect(q.params).toEqual([
      expect.objectContaining({ name: "id", value: 32511772 }),
    ]);
    expect(() => assertReadOnly(q.text)).not.toThrow();
  });

  it("recentQuery — opsiyonel filter'lar param olarak gelir, guard'dan geçer", () => {
    const q = recentQuery({
      lookbackDays: 30,
      limit: 50,
      project: "SUZUKI",
      categoryPrefix: "Hata - EnRoute",
      withDescriptionOnly: true,
    });
    expect(q.text).toMatch(/TOP\s+\(@lim\)/);
    expect(q.text).toMatch(/DATEADD\(day,\s*-@days/);
    expect(q.params.map((p) => p.name).sort()).toEqual(
      ["catPrefix", "days", "lim", "proje"].sort(),
    );
    expect(() => assertReadOnly(q.text)).not.toThrow();
  });

  it("recentQuery — Univera.BugGroup kolonu alias ile döner", () => {
    const q = recentQuery({ lookbackDays: 30, limit: 50 });
    expect(q.text).toMatch(/\[Univera\.BugGroup\]\s+AS\s+\[BugGroup\]/);
  });

  it("distinctValuesQuery — guard'dan geçer", () => {
    const q = distinctValuesQuery({
      column: "rootCause",
      lookbackDays: 90,
      limit: 30,
    });
    expect(q.text).toMatch(/GROUP BY/);
    expect(() => assertReadOnly(q.text)).not.toThrow();
  });
});
