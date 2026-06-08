# Public API — `/api/v1/*`

Varuna (ve gelecekteki diğer istemciler) tarafından çağrılabilen REST endpoint'leri.

## Auth

Tüm `/v1/*` endpoint'leri (health hariç) Bearer token gerektirir:

```
Authorization: Bearer sk-<tenant>-<random>
```

Key sunucu `.env`'inde `API_KEYS=key1:tenant1,key2:tenant2` formatında tanımlanır.

## Base URL

```
https://<IP-tireli>.nip.io/api/v1
```

Örnek: `159.69.45.123` → `https://159-69-45-123.nip.io/api/v1`

## Rate limit

Default: tenant başına 60 istek/dakika. Aşılırsa `429 Too Many Requests` döner:

```json
{
  "error": {
    "message": "Çok fazla istek (rate limit). Lütfen biraz sonra tekrar deneyin.",
    "status": 429,
    "retry_after_seconds": 42
  }
}
```

`Retry-After` header da set edilir.

## Endpoint'ler

### `GET /v1/health` — Public health probe

Auth gerekmez.

```bash
curl https://<base>/api/v1/health
```

Yanıt (200):
```json
{
  "ok": true,
  "version": "v1",
  "kb": {
    "documents": 815,
    "chunks": 6564,
    "embeddings": 6564,
    "vec_available": true
  },
  "timestamp": "2026-05-20T12:34:56.789Z"
}
```

### `GET /v1/stats` — KB istatistikleri (tenant-scoped)

```bash
curl https://<base>/api/v1/stats \
  -H "Authorization: Bearer ${KEY}"
```

Yanıt:
```json
{
  "tenant": "varuna",
  "documents": 45,
  "chunks": 4200,
  "embeddings": 4200,
  "embedding_coverage": 1.0,
  "by_type": { "pdf": 45 },
  "last_ingest_at": "2026-05-20T08:30:00Z"
}
```

### `POST /v1/kb/ask` — RAG generation (halisünasyon-savar)

Body:
```json
{
  "query": "Rut tanımını satış temsilcisine nasıl bağlarım?",
  "topK": 8,
  "rerank": true,
  "verify": true,
  "strictness": "normal",
  "sourceTypes": ["pdf"]
}
```

| Alan | Tip | Default | Açıklama |
|---|---|---|---|
| `query` | string | zorunlu | 3-2000 char |
| `topK` | int | 8 | Retrieve edilen chunk sayısı |
| `rerank` | bool | true | LLM rerank kullan |
| `verify` | bool | true | Halisünasyon verifier pass |
| `strictness` | enum | "normal" | lenient \| normal \| strict |
| `sourceTypes` | string[] | tümü | Filtre: pdf/panorama_screen/ticket_resolution |

Yanıt (200):
```json
{
  "query": "...",
  "answer": "1. Satış Ekibi → Tanımlamalar... [3]\n2. Rut Bilgileri tab'ına... [5]",
  "citations": [
    { "number": 3, "chunk_id": 1493, "doc_id": "screen:...", "source_type": "panorama_screen", "title": "Satış Temsilcisi", "heading_path": "...", "excerpt": "..." },
    { "number": 5, "chunk_id": 5430, "doc_id": "docx:8-5-0-...", "source_type": "pdf", "title": "8.5.0 Farklar", "excerpt": "..." }
  ],
  "refused": false,
  "reason": null,
  "retrieved": [...],
  "meta": {
    "retrievalLatencyMs": 1200,
    "generationLatencyMs": 3400,
    "verifierLatencyMs": 1100,
    "totalLatencyMs": 5800,
    "modelUsed": "claude-sonnet-4-5",
    "rerankUsed": true,
    "verifierUsed": true
  }
}
```

Refused örneği:
```json
{
  "query": "Mars'ta hava nasıl?",
  "answer": "",
  "citations": [],
  "refused": true,
  "reason": "Bilgi bankasında ilgili kaynak bulunamadı.",
  "meta": { "totalLatencyMs": 800, ... }
}
```

### `POST /v1/kb/search` — Sadece retrieval (debug)

Body:
```json
{
  "query": "...",
  "topK": 10,
  "rerank": false,
  "sourceTypes": ["pdf"]
}
```

Yanıt: `{ query, hits: [{ chunk_id, doc_id, title, content, rrfScore, ... }] }`

### `POST /v1/categorize` — Otomatik kategorizasyon

Body:
```json
{
  "description": "Müşteri e-fatura gönderemiyor, GİB hata veriyor",
  "project": "NESTLE",
  "customer_name": "ABC Gıda"
}
```

Yanıt:
```json
{
  "category_id": "ebelge",
  "category_sub": "E-Fatura Gönderim",
  "root_cause_id": "integration",
  "root_cause_sub": "GİB / E-Belge Sağlayıcı",
  "confidence": 0.88,
  "reason": "Soru e-fatura gönderim sorunu hakkında ve GİB hatası belirtilmiş."
}
```

Geçersiz/anlamsız soru → `category_id: "diger"`, `confidence: 0`.

### `POST /v1/analyze` — Tam ticket analizi

Mevcut `runAnalysis` pipeline'ını expose eder — KB grounding + categorize + AI önerileri tek atışta.

Body:
```json
{
  "freeText": "Müşteri e-fatura iptal etmek istiyor ama 'iptal edilemez' diyor",
  "project": "MEY"
}
```

Yanıt: tam `AnalyzeResult` (rootCauseHypotheses, suggestedSteps, customerReplyDraft, kbChunks, ...).

Süre: 15-30 saniye (KB retrieve + Claude analyst + verifier).

### `POST /v1/kb/ingest` — Doküman yükle + chunk'la

`Content-Type: multipart/form-data`

Form alanları:
- `files`: PDF/DOCX dosyaları (multi, max 20, 50 MB/dosya)
- `embedNow`: `"true"` → ingest sonrası embedding'i de hemen üret (yavaş)

```bash
curl -X POST https://<base>/api/v1/kb/ingest \
  -H "Authorization: Bearer ${KEY}" \
  -F "files=@dokuman-1.pdf" \
  -F "files=@dokuman-2.docx" \
  -F "embedNow=true"
```

Yanıt:
```json
{
  "tenant": "varuna",
  "ingested": [
    { "file": "dokuman-1.pdf", "doc_id": "pdf:dokuman-1", "chunks": 32, "tokens": 4200, "changed": true }
  ],
  "errors": [],
  "embeddings_run": { "embedded": 32, "skipped": 0, "durationMs": 12400 }
}
```

Dosyalar `data/kb/pdfs/<tenant>/` veya `data/kb/docs/<tenant>/` altına kaydedilir (tenant izolasyonu).

## Error format

Tüm hatalar şu yapıda:

```json
{
  "error": {
    "message": "Açıklama",
    "status": 400,
    "details": [ ... opsiyonel zod issues ... ]
  }
}
```

| Status | Anlam |
|---|---|
| 400 | Geçersiz girdi (JSON parse, validation) |
| 401 | Auth eksik veya geçersiz |
| 403 | Yetki yok |
| 404 | Bulunamadı |
| 429 | Rate limit |
| 500 | Sunucu hatası |

## Tipik kullanım — Varuna BFF örneği

```javascript
// server/lib/kbClient.js
const BASE = process.env.TICKET_KB_API_BASE;
const KEY = process.env.TICKET_KB_API_KEY;

async function kbCall(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `KB API ${res.status}`);
  }
  return res.json();
}

export const askKB = (query, opts = {}) =>
  kbCall('/api/v1/kb/ask', { query, topK: 8, rerank: true, verify: true, ...opts });

export const categorizeCase = (description, project) =>
  kbCall('/api/v1/categorize', { description, project });

export const analyzeCase = (freeText, project) =>
  kbCall('/api/v1/analyze', { freeText, project });
```

```javascript
// server/routes/cases.js
import { askKB, categorizeCase } from '../lib/kbClient.js';

router.post('/:id/ai-suggest', async (req, res) => {
  const caseObj = await prisma.case.findUnique({ where: { id: req.params.id } });
  const result = await askKB(caseObj.description, { topK: 10 });
  res.json(result);
});

router.post('/', async (req, res) => {
  // Yeni vaka oluştururken kategorize et
  const cat = await categorizeCase(req.body.description, req.body.project).catch(() => null);
  const created = await prisma.case.create({
    data: {
      ...req.body,
      aiCategoryId: cat?.category_id,
      aiCategorySub: cat?.category_sub,
      aiRootCauseId: cat?.root_cause_id,
      // ...
    },
  });
  res.json(created);
});
```
