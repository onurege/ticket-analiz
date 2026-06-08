import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/*
 * NotebookLM helper testleri.
 *
 * `callTool` ve `env` mock'lanır; gerçek bir subprocess spawn edilmez.
 * Amaç: isNotebookLmEnabled davranışı, ticket consult prompt'unun
 * doğru biçimlendiği, hata yollarının kontrol altında olduğu.
 */

const envMock = vi.fn();
const callToolMock = vi.fn();
const extractTextPayloadMock = vi.fn();

vi.mock("@/lib/env", () => ({
  env: () => envMock(),
}));

vi.mock("@/lib/notebooklm/client", () => ({
  callTool: (...args: unknown[]) => callToolMock(...args),
  extractTextPayload: (x: unknown) => extractTextPayloadMock(x),
}));

const DEFAULT_ENV = {
  NOTEBOOKLM_ENABLED: true,
  NOTEBOOKLM_NOTEBOOK_ID: "univera-panorama-d-k-manlar",
  NOTEBOOKLM_NOTEBOOK_URL: undefined,
  NOTEBOOKLM_TIMEOUT_MS: 60000,
  NOTEBOOKLM_AUTO_CONSULT: false,
};

beforeEach(() => {
  envMock.mockReset();
  callToolMock.mockReset();
  extractTextPayloadMock.mockReset();
  envMock.mockReturnValue(DEFAULT_ENV);
  extractTextPayloadMock.mockImplementation((raw: unknown) => raw);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("isNotebookLmEnabled", () => {
  it("ENABLED=false ise false döner", async () => {
    envMock.mockReturnValue({ ...DEFAULT_ENV, NOTEBOOKLM_ENABLED: false });
    const { isNotebookLmEnabled } = await import("@/lib/ticket/notebooklm");
    expect(isNotebookLmEnabled()).toBe(false);
  });

  it("ENABLED=true ama notebook id/url yoksa false döner", async () => {
    envMock.mockReturnValue({
      ...DEFAULT_ENV,
      NOTEBOOKLM_NOTEBOOK_ID: undefined,
      NOTEBOOKLM_NOTEBOOK_URL: undefined,
    });
    const { isNotebookLmEnabled } = await import("@/lib/ticket/notebooklm");
    expect(isNotebookLmEnabled()).toBe(false);
  });

  it("ENABLED=true ve URL set ise true döner", async () => {
    envMock.mockReturnValue({
      ...DEFAULT_ENV,
      NOTEBOOKLM_NOTEBOOK_ID: undefined,
      NOTEBOOKLM_NOTEBOOK_URL: "https://notebooklm.google.com/notebook/abc",
    });
    const { isNotebookLmEnabled } = await import("@/lib/ticket/notebooklm");
    expect(isNotebookLmEnabled()).toBe(true);
  });
});

describe("consultFreeQuestion", () => {
  it("boş soru için fırlatır", async () => {
    const { consultFreeQuestion, NotebookLmCallError } = await import(
      "@/lib/ticket/notebooklm"
    );
    await expect(consultFreeQuestion("   ")).rejects.toBeInstanceOf(
      NotebookLmCallError,
    );
  });

  it("disabled ise NotebookLmDisabledError fırlatır", async () => {
    envMock.mockReturnValue({ ...DEFAULT_ENV, NOTEBOOKLM_ENABLED: false });
    const { consultFreeQuestion, NotebookLmDisabledError } = await import(
      "@/lib/ticket/notebooklm"
    );
    await expect(consultFreeQuestion("test")).rejects.toBeInstanceOf(
      NotebookLmDisabledError,
    );
  });

  it("başarılı yanıtı normalize eder", async () => {
    callToolMock.mockResolvedValue({ ok: true });
    extractTextPayloadMock.mockReturnValue({
      success: true,
      data: {
        question: "test soru",
        answer: "test cevap",
        session_id: "abc123",
        notebook_url: "https://example.com/n",
        sources: [
          {
            marker: "[1]",
            number: 1,
            sourceName: "Doc A",
            sourceText: "İçerik özeti",
          },
        ],
      },
    });
    const { consultFreeQuestion } = await import("@/lib/ticket/notebooklm");
    const out = await consultFreeQuestion("test");
    expect(out.answer).toBe("test cevap");
    expect(out.sessionId).toBe("abc123");
    expect(out.sources).toHaveLength(1);
    expect(out.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("success=false dönerse hata fırlatır", async () => {
    callToolMock.mockResolvedValue({});
    extractTextPayloadMock.mockReturnValue({
      success: false,
      error: "tool failed",
    });
    const { consultFreeQuestion, NotebookLmCallError } = await import(
      "@/lib/ticket/notebooklm"
    );
    await expect(consultFreeQuestion("test")).rejects.toBeInstanceOf(
      NotebookLmCallError,
    );
  });

  it("answer alanı yoksa hata fırlatır", async () => {
    callToolMock.mockResolvedValue({});
    extractTextPayloadMock.mockReturnValue({
      success: true,
      data: { question: "x", answer: "" },
    });
    const { consultFreeQuestion } = await import("@/lib/ticket/notebooklm");
    await expect(consultFreeQuestion("test")).rejects.toThrow(/answer/);
  });

  it("session_id varsa tool args'a eklenir", async () => {
    callToolMock.mockResolvedValue({});
    extractTextPayloadMock.mockReturnValue({
      success: true,
      data: { question: "q", answer: "a" },
    });
    const { consultFreeQuestion } = await import("@/lib/ticket/notebooklm");
    await consultFreeQuestion("test", { sessionId: "sess-1" });
    expect(callToolMock).toHaveBeenCalledWith(
      "ask_question",
      expect.objectContaining({ session_id: "sess-1" }),
    );
  });

  it("NOTEBOOK_ID env'i tool args'a aktarılır", async () => {
    callToolMock.mockResolvedValue({});
    extractTextPayloadMock.mockReturnValue({
      success: true,
      data: { question: "q", answer: "a" },
    });
    const { consultFreeQuestion } = await import("@/lib/ticket/notebooklm");
    await consultFreeQuestion("test");
    expect(callToolMock).toHaveBeenCalledWith(
      "ask_question",
      expect.objectContaining({
        notebook_id: "univera-panorama-d-k-manlar",
        source_format: "footnotes",
      }),
    );
  });

  it("ID yoksa URL fallback'i tool args'a aktarılır", async () => {
    envMock.mockReturnValue({
      ...DEFAULT_ENV,
      NOTEBOOKLM_NOTEBOOK_ID: undefined,
      NOTEBOOKLM_NOTEBOOK_URL: "https://notebooklm.google.com/notebook/abc",
    });
    callToolMock.mockResolvedValue({});
    extractTextPayloadMock.mockReturnValue({
      success: true,
      data: { question: "q", answer: "a" },
    });
    const { consultFreeQuestion } = await import("@/lib/ticket/notebooklm");
    await consultFreeQuestion("test");
    expect(callToolMock).toHaveBeenCalledWith(
      "ask_question",
      expect.objectContaining({
        notebook_url: "https://notebooklm.google.com/notebook/abc",
      }),
    );
  });
});

describe("consultForTicket", () => {
  it("ticket bağlamı boşsa fırlatır", async () => {
    const { consultForTicket, NotebookLmCallError } = await import(
      "@/lib/ticket/notebooklm"
    );
    await expect(consultForTicket({})).rejects.toBeInstanceOf(
      NotebookLmCallError,
    );
  });

  it("ticket alanlarını prompt'a örer", async () => {
    callToolMock.mockResolvedValue({});
    extractTextPayloadMock.mockReturnValue({
      success: true,
      data: { question: "q", answer: "a" },
    });
    const { consultForTicket } = await import("@/lib/ticket/notebooklm");
    await consultForTicket({
      bildirimNo: 12345,
      proje: "Nestle",
      kategori: "E-Belge",
      kokNeden: "GİB Gönderim",
      aciklama: "Fatura gönderilemiyor",
    });
    const callArgs = callToolMock.mock.calls[0]?.[1] as { question: string };
    expect(callArgs).toBeDefined();
    expect(callArgs.question).toContain("Bildirim No: 12345");
    expect(callArgs.question).toContain("Proje: Nestle");
    expect(callArgs.question).toContain("Kategori: E-Belge");
    expect(callArgs.question).toContain("Kök Neden: GİB Gönderim");
    expect(callArgs.question).toContain("Fatura gönderilemiyor");
  });

  it("freeText öncelikli, aciklama'yı geçersiz kılar", async () => {
    callToolMock.mockResolvedValue({});
    extractTextPayloadMock.mockReturnValue({
      success: true,
      data: { question: "q", answer: "a" },
    });
    const { consultForTicket } = await import("@/lib/ticket/notebooklm");
    await consultForTicket({
      aciklama: "kullanılmayacak",
      freeText: "kullanılan metin",
    });
    const callArgs = callToolMock.mock.calls[0]?.[1] as { question: string };
    expect(callArgs).toBeDefined();
    expect(callArgs.question).toContain("kullanılan metin");
    expect(callArgs.question).not.toContain("kullanılmayacak");
  });
});
