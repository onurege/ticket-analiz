import { describe, it, expect } from "vitest";
import { AnalystOutputSchema } from "@/lib/ticket/analyst";

describe("AnalystOutputSchema", () => {
  it("tam form geçerli", () => {
    const v = AnalystOutputSchema.safeParse({
      inferred: {
        bildirim_tipi: "5. Hata",
        oncelik: "Normal",
        katman: "Backoffice",
        kok_neden: "Master Tanım",
        confidence: 0.7,
      },
      rootCauseHypotheses: [{ text: "Rut çakışması", confidence: 0.6 }],
      suggestedSteps: [{ step: "Aktif RUT kartını kontrol et", rationale: null }],
      customerReplyDraft: "Merhaba, ...",
      engineeringHandoff: "Backoffice rut çakışması; ...",
      suggestedBugGroup: null,
      suggestedTfsTip: null,
    });
    expect(v.success).toBe(true);
  });

  it("inferred null olabilir (matched modu)", () => {
    const v = AnalystOutputSchema.safeParse({
      inferred: null,
      rootCauseHypotheses: [{ text: "x", confidence: 0.5 }],
      suggestedSteps: [{ step: "y" }],
      customerReplyDraft: "z",
      engineeringHandoff: "w",
    });
    expect(v.success).toBe(true);
  });

  it("geçersiz oncelik reddedilir", () => {
    const v = AnalystOutputSchema.safeParse({
      inferred: {
        bildirim_tipi: "5. Hata",
        oncelik: "Acil",
        katman: "Backoffice",
        kok_neden: "Master",
        confidence: 0.5,
      },
      rootCauseHypotheses: [{ text: "x", confidence: 0.5 }],
      suggestedSteps: [{ step: "y" }],
      customerReplyDraft: "z",
      engineeringHandoff: "w",
    });
    expect(v.success).toBe(false);
  });

  it("rootCauseHypotheses boş olamaz", () => {
    const v = AnalystOutputSchema.safeParse({
      inferred: null,
      rootCauseHypotheses: [],
      suggestedSteps: [{ step: "y" }],
      customerReplyDraft: "z",
      engineeringHandoff: "w",
    });
    expect(v.success).toBe(false);
  });
});
