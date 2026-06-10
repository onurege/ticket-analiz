/**
 * API client — tip güvenli fetch wrapper.
 */
export type ParetoItem = { label: string; count: number; cumPct: number };

export type Stats = {
  totals: {
    ticket: number;
    operator: number;
    kritikDurduran: number;
    egitimKaynakli: number;
    manuelMudahale: number;
    ebelgeYuzde: number;
    selfServisYuzde: number;
  };
  dateRange: { from?: string; to?: string };
  isSureci: Record<string, number>;
  islemTipi: Record<string, number>;
  etkilenenNesne: Record<string, number>;
  etki: Record<string, number>;
  kokNedenGrup: Record<string, number>;
  kokNedenDetay: Record<string, number>;
  cozumTipi: Record<string, number>;
  platform: Record<string, number>;
  selfServis: Record<string, number>;
  operatorCount: Record<string, number>;
  operatorAvgChars: Record<string, number>;
  daily: Record<string, number>;
  xtab: Record<string, Record<string, number>>;
  paretoDetay: ParetoItem[];
  paretoGrup: ParetoItem[];
};

export type TicketListItem = {
  bildirimNo: number;
  kullanici: string | null;
  gdt: string;
  preview: string;
  cozumLen: number;
  isSureci: string;
  islemTipi: string;
  etkilenenNesne: string;
  etki: string;
  kokNedenGrup: string;
  kokNedenDetay: string;
  cozumTipi: string;
  platform?: string | null;
  selfServis?: string | null;
};

export type TicketList = {
  total: number;
  page: number;
  limit: number;
  pages: number;
  items: TicketListItem[];
};

export type TicketDetail = {
  ticket: TicketListItem & {
    musteriSorunu: string;
    tespitSorun: string;
    cozumText: string;
    confidence: number;
    reason: string;
    categorizedAt: string;
  };
  operatorStats: { tickets: number; avgChars: number } | null;
};

const BASE = "";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return (await res.json()) as T;
}

export const api = {
  stats: () => get<Stats>("/api/stats"),
  statsV1: () => get<Stats>("/api/stats/v1"),
  tickets: (q: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(Object.entries(q).map(([k, v]) => [k, String(v)])).toString();
    return get<TicketList>(`/api/tickets${qs ? "?" + qs : ""}`);
  },
  ticket: (id: number) => get<TicketDetail>(`/api/tickets/${id}`),
  refresh: async () => {
    const res = await fetch(`${BASE}/api/refresh`, { method: "POST" });
    if (!res.ok) throw new Error("Refresh başarısız");
    return (await res.json()) as { ok: boolean; fetched: number };
  },
  recategorize: async (includeRefresh = true) => {
    const res = await fetch(`${BASE}/api/recategorize?include_refresh=${includeRefresh}`, { method: "POST" });
    if (!res.ok) throw new Error("Recategorize başarısız");
    return (await res.json()) as {
      ok: boolean;
      total: number;
      changed: number;
      unchanged: number;
      diffByField: Record<string, number>;
      refresh?: { fetched: number };
    };
  },
  health: () => get<{ ok: boolean; mssql: { ok: boolean; latencyMs: number }; cache: { count: number } }>("/api/health"),
  embeddingsHealth: () => get<{ total: number; model: string }>("/api/health/embeddings"),
  categorize: async (text: string, k = 10) => {
    const res = await fetch(`/api/categorize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, k }),
    });
    if (!res.ok) throw new Error(`Categorize ${res.status}`);
    return (await res.json()) as CategorizeResponse;
  },
  feedback: async (body: FeedbackBody) => {
    const res = await fetch(`/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Feedback ${res.status}`);
    return (await res.json()) as { ok: boolean; bildirimNo: number; vectorStoreSize: number };
  },
};

export type Labels9 = {
  kategori: string;
  etkilenen_nesne: string;
  platform: string;
  islem_tipi: string;
  etki: string;
  kok_neden_grup: string;
  kok_neden_detay: string;
  cozum_tipi: string;
  self_servis: string;
};

export type CategorizeResponse = {
  labels: Labels9;
  confidence: number;
  reasoning: string;
  similarExamples: Array<{
    bildirimNo: number;
    similarity: number;
    musteriSorunu: string;
    labels: { kategori: string | null; islem_tipi: string | null; kok_neden_grup: string | null };
  }>;
  meta: { model: string; similarSearchMs: number; aiMs: number; k: number };
};

export type FeedbackBody = {
  sourceText: string;
  aiSuggestion: Labels9 | null;
  finalLabels: Labels9;
  bildirimNo?: number;
  wasCorrected: boolean;
};
