import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  listSolutions,
  saveSolution,
  searchSolutions,
  getSolution,
} from "@/lib/ticket/solutions";

let tmp: string;
let prev: string;

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), "solutions-"));
  prev = process.cwd();
  process.chdir(tmp);
});

afterEach(() => {
  process.chdir(prev);
  rmSync(tmp, { recursive: true, force: true });
});

describe("solutions", () => {
  it("save + get + list", () => {
    const s = saveSolution({
      title: "Rut çakışması çözümü",
      body: "Aktif satış temsilcisi kartından rut çıkar.",
      tags: ["rut", "backoffice"],
    });
    expect(s.id).toMatch(/^rut-cakismasi-cozumu-[0-9a-f]{6}$/);
    expect(getSolution(s.id)?.body).toContain("Aktif");
    expect(listSolutions().length).toBe(1);
  });

  it("search title / body / tag", () => {
    saveSolution({
      title: "Rut çakışması",
      body: "satış temsilcisi",
      tags: ["rut"],
    });
    saveSolution({
      title: "Tablet yazıcı bağlantısı",
      body: "Bluetooth ayarlar",
      tags: ["printer"],
    });
    expect(searchSolutions("rut").length).toBe(1);
    expect(searchSolutions("bluetooth").length).toBe(1);
    expect(searchSolutions("yazıcı").length).toBe(1);
    expect(searchSolutions("xyz").length).toBe(0);
  });

  it("boş query tümünü döner", () => {
    saveSolution({ title: "A", body: "aaa" });
    saveSolution({ title: "B", body: "bbb" });
    expect(searchSolutions("").length).toBe(2);
  });
});
