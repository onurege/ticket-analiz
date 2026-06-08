import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  synthesisIdFor,
  saveSynthesis,
  loadSynthesis,
  listSyntheses,
  type SynthesisRecord,
} from "@/lib/ticket/synthesis-storage";

let tmp: string;
let prev: string;

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), "synth-"));
  prev = process.cwd();
  process.chdir(tmp);
});

afterEach(() => {
  process.chdir(prev);
  rmSync(tmp, { recursive: true, force: true });
});

function rec(id: string, key: string, t: number): SynthesisRecord {
  return {
    meta: {
      id,
      groupBy: "kok_neden",
      groupKey: key,
      totalInGroup: t,
      sampledCount: 5,
      ticketIds: [1, 2, 3, 4, 5],
      modelUsed: "gemini-2.5-flash",
      latencyMs: 1000,
      createdAt: "2026-05-14T00:00:00.000Z",
      updatedAt: "2026-05-14T00:00:00.000Z",
    },
    synthesis: { pattern: { title: "X" } },
  };
}

describe("synthesis-storage", () => {
  it("synthesisIdFor deterministik", () => {
    const a = synthesisIdFor("kok_neden", "Master Tanım / Müşteri");
    const b = synthesisIdFor("kok_neden", "Master Tanım / Müşteri");
    expect(a).toBe(b);
    expect(a).toMatch(/^synth-kok-neden-master-tanim-musteri-[0-9a-f]{6}$/);
  });

  it("farklı groupBy farklı id üretir", () => {
    const a = synthesisIdFor("kok_neden", "X");
    const b = synthesisIdFor("kategori_uzun", "X");
    expect(a).not.toBe(b);
  });

  it("save + load roundtrip", () => {
    const id = synthesisIdFor("kok_neden", "Test");
    saveSynthesis(rec(id, "Test", 10));
    const loaded = loadSynthesis(id);
    expect(loaded?.meta.totalInGroup).toBe(10);
  });

  it("aynı id'ye save edilince üzerine yazar, createdAt korunur", () => {
    const id = synthesisIdFor("kok_neden", "Test");
    saveSynthesis(rec(id, "Test", 10));
    // updatedAt değiştir, createdAt'i farklı ver — saveSynthesis prev createdAt'i koruyacak
    const updated: SynthesisRecord = {
      ...rec(id, "Test", 25),
      meta: {
        ...rec(id, "Test", 25).meta,
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T00:00:00.000Z",
      },
    };
    saveSynthesis(updated);
    const loaded = loadSynthesis(id);
    expect(loaded?.meta.totalInGroup).toBe(25);
    expect(loaded?.meta.createdAt).toBe("2026-05-14T00:00:00.000Z");
  });

  it("listSyntheses tüm kayıtları döner, updatedAt DESC", () => {
    saveSynthesis(rec("synth-a", "A", 5));
    saveSynthesis({
      ...rec("synth-b", "B", 5),
      meta: { ...rec("synth-b", "B", 5).meta, updatedAt: "2026-06-01T00:00:00.000Z" },
    });
    const list = listSyntheses();
    expect(list.length).toBe(2);
    expect(list[0]?.id).toBe("synth-b");
  });
});
