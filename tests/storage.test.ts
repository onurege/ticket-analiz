import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  newAnalysisId,
  saveAnalysis,
  loadAnalysis,
  listAnalyses,
  appendFeedback,
  writeHandoff,
} from "@/lib/ticket/storage";

let tmp: string;
let prev: string;

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), "ticket-storage-"));
  prev = process.cwd();
  process.chdir(tmp);
});

afterEach(() => {
  process.chdir(prev);
  rmSync(tmp, { recursive: true, force: true });
});

describe("storage", () => {
  it("newAnalysisId deterministik form üretir", () => {
    const id = newAnalysisId("tk-12345");
    expect(id).toMatch(/^\d{8}-tk-\d+-[0-9a-f]{6}$/);
  });

  it("save + load roundtrip", () => {
    const id = newAnalysisId("test");
    const rec = {
      meta: {
        analysisId: id,
        createdAt: "2026-05-14T00:00:00.000Z",
        mode: "bildirim_no" as const,
        bildirimNo: 1,
        projectHint: null,
        modelUsed: "gemini-2.5-flash",
        severity: "Normal",
        category: "x",
      },
      input: { bildirimNo: 1 },
      analysis: { foo: "bar" },
    };
    saveAnalysis(rec);
    const loaded = loadAnalysis(id);
    expect(loaded).not.toBeNull();
    expect(loaded?.meta.analysisId).toBe(id);
    expect(loaded?.analysis).toEqual({ foo: "bar" });
  });

  it("listAnalyses son N'i döner", () => {
    for (let i = 0; i < 3; i++) {
      const id = newAnalysisId(`t-${i}`);
      saveAnalysis({
        meta: {
          analysisId: id,
          createdAt: new Date().toISOString(),
          mode: "free_text",
          bildirimNo: null,
          projectHint: null,
          modelUsed: "m",
          severity: null,
          category: null,
        },
        input: {},
        analysis: {},
      });
    }
    const list = listAnalyses();
    expect(list.length).toBe(3);
  });

  it("appendFeedback satırı .jsonl'a ekler", () => {
    const id = newAnalysisId("fb");
    saveAnalysis({
      meta: {
        analysisId: id,
        createdAt: "x",
        mode: "free_text",
        bildirimNo: null,
        projectHint: null,
        modelUsed: "m",
        severity: null,
        category: null,
      },
      input: {},
      analysis: {},
    });
    appendFeedback({
      feedbackId: "fb1",
      analysisId: id,
      verdict: "solved",
      createdAt: "2026-05-14T00:00:00.000Z",
    });
    const p = path.join("data/ticket-analysis", id, "feedback.jsonl");
    const txt = readFileSync(p, "utf8");
    expect(txt).toContain("solved");
  });

  it("writeHandoff dosyayı yazar", () => {
    const id = newAnalysisId("ho");
    const p = writeHandoff(id, "# Test\nyazılım ekibine aktarıldı");
    expect(existsSync(p)).toBe(true);
    expect(readFileSync(p, "utf8")).toContain("Test");
  });
});
