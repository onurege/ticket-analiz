import { describe, it, expect } from "vitest";
import { assertReadOnly } from "@/lib/db";

describe("assertReadOnly", () => {
  it("temiz SELECT'i geçirir", () => {
    expect(() =>
      assertReadOnly("SELECT TOP 1 [Bildirim_No] FROM [dbo].[VIEW_BILDIRIM_AI_ANALIZ_DATA]"),
    ).not.toThrow();
  });

  it.each([
    ["INSERT INTO foo VALUES(1)"],
    ["UPDATE foo SET x=1"],
    ["DELETE FROM foo"],
    ["DROP TABLE foo"],
    ["ALTER TABLE foo ADD c INT"],
    ["CREATE TABLE foo (id INT)"],
    ["TRUNCATE TABLE foo"],
    ["MERGE INTO foo USING bar ON 1=1 WHEN MATCHED THEN DELETE;"],
    ["EXEC sp_help"],
    ["EXECUTE sp_help"],
    ["GRANT SELECT ON foo TO x"],
    ["REVOKE SELECT ON foo FROM x"],
    ["DENY SELECT ON foo TO x"],
    ["SELECT * INTO new_tbl FROM foo"],
    ["SELECT 1; SELECT 2"],
  ])("yasaklı: %s", (q) => {
    expect(() => assertReadOnly(q)).toThrow(/Read-only guard/);
  });

  it("yorum içinde gizlenmiş INSERT'i de reddeder", () => {
    expect(() =>
      assertReadOnly("SELECT 1 -- foo\nINSERT INTO x VALUES(1)"),
    ).toThrow();
  });

  it("blok yorumdaki kelimeler yanıltmamalı (yorumlar strip ediliyor)", () => {
    expect(() =>
      assertReadOnly("/* INSERT bla bla */ SELECT 1 FROM dbo.foo"),
    ).not.toThrow();
  });
});
