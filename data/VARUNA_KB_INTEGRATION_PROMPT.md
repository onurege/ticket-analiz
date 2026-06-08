# Varuna Case Management — Bilgi Bankası (KB) + RAG Entegrasyonu

> **Bu prompt'u Varuna projesinin root'unda Codex'e ver.** Codex'in mevcut
> codebase'i (Express + Prisma + Postgres + Supabase + OpenAI) zaten okuduğu
> varsayılır. Aşağıdaki tüm dosyalar **yeni eklenecek** veya işaretlenmiş
> yerlerde **var olan dosyaya eklenecektir**. Var olan API contract'larını
> bozma, yeni feature olarak gel.

## 1. Hedef

Varuna'ya halisünasyon-savar **Retrieval-Augmented Generation** katmanı ekle:

- Operatör/agent, vaka detayında **"Bilgi Bankasında Ara"** butonuna bastığında
- Sorusu/sorunu üzerinden **PDF/DOCX dökümanlardan** alıntılı cevap üretilir
- Yeni vaka oluşturulurken **otomatik kategorizasyon** yapılır (var olan
  `CaseType` / `CaseRequestType` / `CasePriority` enum'larından seçim)
- Tüm cevaplar **kaynak referanslı**: model uydurursa cümle düşürülür
  (verifier pass)
- **Multi-tenant**: her şey `companyId` ile filtrelenir; bir şirketin KB'si
  başka şirkete sızmaz

## 2. Veri kaynakları (kullanıcı sağlayacak)

Kullanıcı şu dosyaları proje root'unda **`data/kb-sources/<companyId>/`**
altına koyacak (companyId klasörü zorunlu — multi-tenant izolasyonu):

```
data/kb-sources/
├── <companyId-1>/
│   ├── pdfs/*.pdf       (PDF dökümanlar)
│   └── docs/*.docx      (Word dosyaları)
└── <companyId-2>/
    └── ...
```

PDF ve DOCX'leri **ayrı ayrı** ingest et. İlk test için kullanıcı 45 dosya
verecek (Türkçe Panorama versiyon farkları + 1 PDF) — TÜM içerik **Türkçe**.

## 3. Tech stack kısıtları

| | |
|---|---|
| Backend | Express (mevcut), Node.js |
| ORM | **Prisma** — yeni model ekle, mevcut `KnowledgeSource`'u GENİŞLET |
| DB | **PostgreSQL** + **pgvector** extension (raw SQL ile aktif et) |
| Vector index | **pgvector** (HNSW), Prisma'nın yönetmediği raw SQL ile |
| Embedding | **OpenAI `text-embedding-3-large`** (3072 dim, dimensions config ile 1536'ya düşürülebilir → maliyet/hız) — varsayılan **1536** |
| Generation | **OpenAI `gpt-4o`** (analyst + KB ask için) + **`gpt-4o-mini`** (verifier + categorizer için, `tier: "fast"` mantığı) |
| Auth | Mevcut **Supabase JWT** akışı (`verifyJwt`) — yeni endpoint'lere de uygula |
| OpenAI SDK | Mevcut `server/lib/aiClient.js`'i kullan — yeni client oluşturma |

**MSSQL portability kuralı**: Prisma şemasında `Unsupported("vector(...)")`
kullanma, `Bytes` (BYTEA) kullan. Vector index `prisma/migrations/*.sql`
içinde raw SQL ile eklenir (sadece Postgres'te etkili olur — MSSQL'e
taşınırsa o tablolar normal `VARBINARY` olarak kalır, vector search çalışmaz
ama metin kısımları çalışır).

## 4. Prisma şeması — yeni modeller

`prisma/schema.prisma` sonuna ekle (mevcut modellere dokunma):

```prisma
// ============================================================
// Knowledge Base (RAG) — Phase B
// ============================================================

enum KbSourceFormat {
  pdf
  docx
  manual
  case_history
}

/// Bir dökümanın kanonik kaydı. Bir KnowledgeSource'a bağlanabilir
/// (gruplama için) ama gerek yok (NULL).
model KbDocument {
  id              String         @id @default(cuid())
  companyId       String         // multi-tenant izolasyon
  knowledgeSourceId String?      // opsiyonel — UI'da gruplama için
  sourceFormat    KbSourceFormat
  sourceUri       String?        // orijinal dosya yolu / URL / kayıt id
  title           String
  contentHash     String         // sha256 — değişiklik tespiti
  chunkCount      Int            @default(0)
  tokenCount      Int            @default(0)
  metadata        Json?          // {pages, mtime, pdf_info, ...}
  ingestedAt      DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  chunks          KbChunk[]
  knowledgeSource KnowledgeSource? @relation(fields: [knowledgeSourceId], references: [id], onDelete: SetNull)

  @@index([companyId])
  @@index([sourceFormat])
  @@index([knowledgeSourceId])
}

/// Bir dökümanın chunk'ı — embedding birimi.
model KbChunk {
  id            String     @id @default(cuid())
  documentId    String
  companyId     String     // denormalize edilmiş (retrieval JOIN ucuzlatma)
  ord           Int        // doc içinde sıra
  headingPath   String?    // "A > B > C"
  content       String     // chunk metni (max ~4000 char)
  tokenCount    Int
  contentHash   String     // sha256 — yeniden embed gerek mi tespit
  embedding     Bytes?     // float32 BLOB (1536 * 4 = 6144 bytes)
  embeddingModel String?   // örn. "text-embedding-3-large@1536"
  createdAt     DateTime   @default(now())
  document      KbDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@unique([documentId, ord])
  @@index([companyId])
  @@index([documentId])
}

/// Soru-cevap audit log'u (debug + telemetri + AIUsageLog'a köprü).
model KbAsk {
  id              String   @id @default(cuid())
  companyId       String
  userId          String?
  caseId          String?  // bağlı vaka varsa
  query           String
  answer          String?
  refused         Boolean  @default(false)
  refusedReason   String?
  citationsJson   Json?    // [{number, chunkId, title, excerpt}]
  retrievedJson   Json?    // top-K chunk id + score
  modelUsed       String?
  totalLatencyMs  Int?
  createdAt       DateTime @default(now())

  @@index([companyId])
  @@index([caseId])
  @@index([createdAt])
}
```

`KnowledgeSource` modeline (mevcut) **bir relation ekle**:

```prisma
model KnowledgeSource {
  // ... mevcut alanlar
  documents KbDocument[]
}
```

## 5. Migration (raw SQL — pgvector + indexler)

`prisma migrate dev --name add_kb_rag` çalıştır → yeni migration oluşacak.
Otomatik üretilen SQL'in **sonuna** şu raw SQL'i ekle (manuel düzenle):

```sql
-- pgvector extension (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- KbChunk.embedding üzerinde pgvector index için generated column ekle
-- (Prisma BYTEA tutuyor; biz onu vector'a cast eden bir computed column açıyoruz)
-- NOT: bytea_to_vector cast'i pgvector ≥0.7.0 ile mevcut. Eski sürümde
--      raw SQL'de manual cast gerekir.

-- Alternatif: ayrı bir tablo
CREATE TABLE IF NOT EXISTS "KbChunkVec" (
  chunk_id TEXT PRIMARY KEY REFERENCES "KbChunk"(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL,
  embedding vector(1536) NOT NULL
);

CREATE INDEX IF NOT EXISTS "KbChunkVec_company_id_idx" ON "KbChunkVec"(company_id);

-- HNSW index (cosine distance — text-embedding-3 normalized)
CREATE INDEX IF NOT EXISTS "KbChunkVec_embedding_hnsw"
  ON "KbChunkVec" USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Türkçe FTS için tsvector (generated column)
ALTER TABLE "KbChunk" ADD COLUMN IF NOT EXISTS
  content_tsv tsvector GENERATED ALWAYS AS
    (to_tsvector('simple', coalesce(content, '') || ' ' || coalesce("headingPath", '')))
  STORED;

CREATE INDEX IF NOT EXISTS "KbChunk_content_tsv_gin" ON "KbChunk" USING gin(content_tsv);
```

Not: `KbChunkVec` ayrı tablo tutmanın gerekçesi — Prisma BYTEA'sı ile
pgvector vector tipi arasında temiz ayrım. Embedder yazarken hem
`KbChunk.embedding` (BYTEA, MSSQL portability için) hem `KbChunkVec.embedding`
(pgvector arama için) doldurulur. MSSQL'e geçilirse `KbChunkVec` drop edilir,
keyword-only fallback'e geçilir.

## 6. Modüller — `server/lib/kb/` altında

### 6.1 `server/lib/kb/chunker.js`

Heading-aware chunker. Markdown başlıkları (`#`), numara prefix
(`1.2 Başlık`), büyük harfli kısa satırlar başlık olarak tanınır. Hedef:
800 token max, 80 overlap, 60 min.

İmplementasyon: token sayımı yaklaşık (kelime × 1.3), cümle bazlı window'lama,
overlap için son cümlelerden tekrar kullanma. **Önemli**: minTokens guard'ı
yalnız aynı `heading_path` altındaki chunk'ları birleştir (farklı heading'leri
karıştırma — bu bug bizim referans projede yakalandı).

```javascript
export function chunkText(text, opts = {}) {
  // ... heading detection + window by sentences + overlap
  return [{ ord, heading_path, content, token_count }, ...];
}
```

### 6.2 `server/lib/kb/embedder.js`

OpenAI embedding'i batch ile çağırır. Tek dosya tek model.

```javascript
import { aiClient } from '../aiClient.js';

const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-large';
const EMBED_DIM = Number(process.env.OPENAI_EMBED_DIM || 1536);

export async function embed(text) {
  const resp = await aiClient.embeddings.create({
    model: EMBED_MODEL,
    input: text.slice(0, 8000),
    dimensions: EMBED_DIM,
  });
  return resp.data[0].embedding;
}

export async function embedBatch(texts) {
  // OpenAI API'sinin native batch'i — bir istekte 100'e kadar
  const BATCH = 100;
  const out = [];
  for (let i = 0; i < texts.length; i += BATCH) {
    const slice = texts.slice(i, i + BATCH).map(t => t.trim().slice(0, 8000) || '.');
    const resp = await aiClient.embeddings.create({
      model: EMBED_MODEL,
      input: slice,
      dimensions: EMBED_DIM,
    });
    for (const item of resp.data) out.push(item.embedding);
  }
  return out;
}

// Float32 array <-> Bytes (BYTEA) helpers
export function vectorToBuffer(vec) {
  return Buffer.from(new Float32Array(vec).buffer);
}
export function bufferToVector(buf) {
  return Array.from(new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4));
}
```

### 6.3 `server/lib/kb/sources/pdf.js`

`pdf-parse` v2 ile her sayfayı `## Sayfa N` heading'i altına yerleştir,
chunker'a ver. Dosya hash (sha256) → `contentHash`. Idempotent: aynı hash
varsa atla.

### 6.4 `server/lib/kb/sources/docx.js`

`mammoth` ile HTML'e çevir → inline regex ile heading'leri `#`'li
markdown'a dönüştür → chunker'a ver.

### 6.5 `server/lib/kb/ingest.js`

Tek bir companyId için tam ingest:

1. `data/kb-sources/<companyId>/pdfs/*.pdf` ve `docs/*.docx` listele
2. Her dosya için: hash hesapla → `KbDocument` upsert (var olan ve aynı hash
   ise atla) → chunk üret → `KbChunk` insert (CASCADE eski chunks silindi)
3. Embed eksik chunk'ları sorgula (`KbChunk.embeddingModel != current`) →
   batch'le embed → `KbChunk.embedding` (BYTEA) ve `KbChunkVec.embedding`
   (pgvector) yaz (transaction içinde)
4. İstatistik dön: doc/chunk/embed sayısı

### 6.6 `server/lib/kb/retrieve.js`

**Hibrit retrieval + RRF + opsiyonel rerank**.

```javascript
export async function retrieve(companyId, query, opts = {}) {
  const topK = opts.topK || 8;
  const rawK = opts.rawK || 50;

  // 1) Paralel BM25 (FTS) + vector
  const [ftsHits, vecHits] = await Promise.all([
    ftsSearch(companyId, query, rawK),
    vectorSearch(companyId, query, rawK),
  ]);

  // 2) Reciprocal Rank Fusion
  const fused = rrf([ftsHits, vecHits], 60).slice(0, opts.fusedK || 20);

  // 3) Chunk içerikleri çek
  const chunks = await prisma.kbChunk.findMany({
    where: { id: { in: fused.map(f => f.chunkId) }, companyId },
    include: { document: true },
  });

  // 4) Opsiyonel rerank (gpt-4o-mini ile)
  if (opts.rerank) return rerankWithLLM(query, chunks, topK);
  return chunks.slice(0, topK);
}
```

FTS sorgusu:
```sql
SELECT id FROM "KbChunk"
WHERE "companyId" = $1
  AND content_tsv @@ plainto_tsquery('simple', $2)
ORDER BY ts_rank(content_tsv, plainto_tsquery('simple', $2)) DESC
LIMIT $3;
```

Vector sorgusu:
```sql
SELECT chunk_id, embedding <=> $1::vector AS distance
FROM "KbChunkVec"
WHERE company_id = $2
ORDER BY embedding <=> $1::vector
LIMIT $3;
```

`<=>` cosine distance operator (pgvector).

### 6.7 `server/lib/kb/ask.js`

**Halisünasyon-savar RAG**:

```javascript
export async function ask(companyId, query, opts = {}) {
  // 1) Retrieve
  const chunks = await retrieve(companyId, query, { topK: 12, rerank: true });

  // 2) Confidence guard
  if (chunks.length === 0 || chunks[0].rrfScore < MIN_RRF) {
    return { refused: true, reason: 'Yeterli kaynak yok', citations: [] };
  }

  // 3) Generation (gpt-4o + strict citation system)
  const answer = await callOpenAI({
    system: STRICT_GROUNDING_SYSTEM,
    user: buildPrompt(query, chunks),
    schema: ASK_SCHEMA, // strict json_schema
  });

  // 4) Verifier pass (gpt-4o-mini)
  const verified = await verifyClaims(answer, chunks);

  // 5) Audit log
  await prisma.kbAsk.create({ data: {...} });

  return { answer: verified.text, citations, refused: false };
}
```

`STRICT_GROUNDING_SYSTEM`:
```
SADECE <KAYNAKLAR> bölümündeki alıntılara dayanarak cevap ver.
Kaynaklarda yoksa "refused": true döndür.
Her teknik iddiaya kaynak numarası [N] ekle.
Detaylı ve operasyonel ol: menü adımlarını, alan/buton isimlerini AYNEN yaz.
"X'i Y'ye bağla" türü sorularda iki yön (X→Y ve Y→X) düşün.
```

### 6.8 `server/lib/kb/categorizer.js`

Yeni vaka oluşturulurken çağrılır. **Varuna'nın MEVCUT enum'larından** seçim
yapar — yeni taksonomi açma. Çıktı:

```typescript
{
  caseType: CaseType,        // GeneralSupport | ProactiveTracking | Churn
  requestType: CaseRequestType, // Bilgi | Öneri | Talep | Şikayet | Hata
  priority: CasePriority,    // Low | Medium | High | Critical
  rootCauseId: string,       // kök neden taksonomisi (yeni JSON)
  rootCauseSub: string,
  confidence: number,
  reason: string,
}
```

Kök neden için yeni JSON: `data/kb-taxonomy/root-causes.json` (companyId
agnostic — tüm şirketler aynı taksonomi):

```json
{
  "root_causes": [
    { "id": "user-error", "name": "Kullanıcı Hatası", "subs": [...] },
    { "id": "configuration", "name": "Konfigürasyon", "subs": [...] },
    { "id": "software-defect", "name": "Yazılım Hatası", "subs": [...] },
    { "id": "integration", "name": "Entegrasyon / 3. Parti", "subs": [...] },
    { "id": "performance", "name": "Performans", "subs": [...] },
    { "id": "data", "name": "Veri Sorunu", "subs": [...] },
    { "id": "permission", "name": "Yetki", "subs": [...] },
    { "id": "documentation", "name": "Doküman Eksikliği", "subs": [...] },
    { "id": "feature-request", "name": "Özellik Talebi", "subs": [...] },
    { "id": "known-issue", "name": "Bilinen Sorun", "subs": [...] },
    { "id": "other", "name": "Diğer", "subs": [...] }
  ]
}
```

Kullanıcı isterse ileride şirket bazlı override için
`CompanySettings.rootCauseOverride` (Json) eklenebilir — şimdilik gerek yok.

`Case` modeline yeni alanlar:

```prisma
model Case {
  // ... mevcut
  aiRootCauseId   String?
  aiRootCauseSub  String?
  aiCategoryConfidence Float?
  aiCategoryReason String?
}
```

## 7. API Endpoint'leri (Express routes)

`server/routes/kb.js` (yeni dosya):

```javascript
import { Router } from 'express';
import { verifyJwt } from '../db/auth.js';
import { ask } from '../lib/kb/ask.js';
import { retrieve } from '../lib/kb/retrieve.js';
import { ingestForCompany } from '../lib/kb/ingest.js';

const router = Router();
router.use(verifyJwt);

// POST /api/kb/ask — RAG
router.post('/ask', async (req, res) => {
  const companyId = req.user.companyId;
  const { query, caseId } = req.body;
  if (!query?.trim()) return res.status(400).json({ error: 'query gerekli' });
  const result = await ask(companyId, query, { caseId });
  res.json(result);
});

// POST /api/kb/search — sadece retrieval (debug)
router.post('/search', async (req, res) => {
  const result = await retrieve(req.user.companyId, req.body.query, req.body);
  res.json({ hits: result });
});

// POST /api/kb/ingest — admin only, full ingest for company
router.post('/ingest', requireAdmin, async (req, res) => {
  const stats = await ingestForCompany(req.user.companyId);
  res.json(stats);
});

// GET /api/kb/stats — current state
router.get('/stats', async (req, res) => {
  const stats = await getKbStats(req.user.companyId);
  res.json(stats);
});

export default router;
```

`server/app.js`'e ekle:
```javascript
import kbRouter from './routes/kb.js';
app.use('/api/kb', kbRouter);
```

Mevcut `routes/cases.js` POST endpoint'inde (yeni case oluşturma):
- Description'ı al → `categorizer.categorize(description)` çağır
- Dönen `caseType`, `requestType`, `priority`, `aiRootCauseId`, vs. ile case'i yaz
- Hata olursa case yine açılsın (silent fail) — uyarı dönmek için response'a `warnings.categorize` ekle

## 8. CLI script — `scripts/ingest-kb.js`

```bash
node scripts/ingest-kb.js --company <companyId> [--max-embed N] [--skip-embed]
```

Akış:
1. `data/kb-sources/<companyId>/pdfs/` ve `docs/` listele
2. PDF/DOCX ingest et (idempotent)
3. Bekleyen embed'leri toplu üret
4. Sonuç stats yazdır

Resumable olmalı — kesilirse aynı komut kaldığı yerden devam etmeli
(`embeddingModel` kolonu ile bekleyenler filtrelenir).

## 9. UI — React komponentleri

### 9.1 `src/components/kb/KnowledgeBaseCard.tsx`

Vaka detay sayfasına yerleştirilecek. "Bilgi Bankasında Ara" butonu →
`POST /api/kb/ask` → cevap + collapsible kaynak listesi. Refused durumunda
sarı uyarı kartı.

UI varolan tasarım sistemine (`src/components/ui/`) uy. Loading state için
mevcut `Spinner` veya `Skeleton` kullan.

### 9.2 Vaka oluşturma form'una uyarı

Yeni vaka oluşturulduğunda backend dönen `warnings.categorize` varsa
form üstünde sarı banner: "AI kategorize başarısız. Manuel olarak ayarlayın."

## 10. Environment variables (`.env`)

`.env.example`'a ekle:

```bash
# KB / RAG (OpenAI)
OPENAI_EMBED_MODEL=text-embedding-3-large
OPENAI_EMBED_DIM=1536
OPENAI_ANALYST_MODEL=gpt-4o            # KB ask + categorize için
OPENAI_FAST_MODEL=gpt-4o-mini          # verifier + rerank için
KB_MIN_RRF_SCORE=0.005
KB_TOP_K=8
KB_RERANK_DEFAULT=true
KB_VERIFY_DEFAULT=true
```

## 11. Migration sırası ve test

1. `npm install pdf-parse mammoth` (eklenecek deps — pgvector için JS paketi
   GEREKMEZ, sadece postgres extension)
2. `prisma migrate dev --name add_kb_rag` → yeni tabloları ekle
3. Bu migration'ın .sql'ine **yukarıdaki raw SQL'i manuel ekle** (extension,
   KbChunkVec, FTS index)
4. `prisma generate`
5. Tek bir companyId için test ingest:
   ```bash
   mkdir -p data/kb-sources/<companyId>/pdfs
   cp ~/Downloads/farklar/*.pdf data/kb-sources/<companyId>/pdfs/
   mkdir -p data/kb-sources/<companyId>/docs
   cp ~/Downloads/farklar/*.docx data/kb-sources/<companyId>/docs/
   node scripts/ingest-kb.js --company <companyId>
   ```
6. Smoke test:
   ```bash
   curl -X POST http://localhost:3000/api/kb/search \
     -H "Authorization: Bearer <jwt>" \
     -H "Content-Type: application/json" \
     -d '{"query":"e-fatura gönderim hatası","topK":5}'
   ```
7. RAG test:
   ```bash
   curl -X POST http://localhost:3000/api/kb/ask \
     -H "Authorization: Bearer <jwt>" \
     -H "Content-Type: application/json" \
     -d '{"query":"Rut tanımını satış temsilcisine nasıl bağlarım?"}'
   ```

## 12. Halisünasyon-savar mekanizmaları (özet)

5 katman halinde:

1. **Strict grounding system prompt**: "yalnız kaynaklardan; yoksa refused"
2. **JSON schema strict mode**: `callOpenAI` ile zaten var, kullan
3. **Confidence threshold**: top RRF skoru `KB_MIN_RRF_SCORE` altıysa
   generation YAPILMAZ
4. **Citation enforcement**: cevaptaki `[N]` regex ile çıkarılır,
   chunk'larla cross-check edilir
5. **Verifier pass**: ikinci LLM çağrısı (`gpt-4o-mini`, cheap), her cümle
   için "bu kaynak X'te destekleniyor mu" sorulur; desteklenmeyenler
   yanıttan silinir, çok azaldıysa refused

## 13. Multi-tenant güvenlik

**MUTLAK kural**: Hiçbir KB sorgusu `companyId` filtresi olmadan
çalışmamalı. Üç yerden gelir:

1. `req.user.companyId` (Supabase JWT'den) — Express middleware'de zaten var
2. Tüm `KbDocument`, `KbChunk`, `KbChunkVec` sorgularında WHERE clause
3. Pgvector index `company_id`'yi de içerir (HNSW filter zayıf olabilir;
   gerekirse `company_id`'ye ayrı btree index ekle ve önce filter sonra
   vector sırala)

## 14. Telemetri ve maliyet

Her `ask` çağrısında `AIUsageLog`'a kayıt (mevcut `logAIUsage` helper'ı
kullan). `KbAsk` tablosu özel audit; `AIUsageLog` genel telemetri.

OpenAI maliyetleri:
- Embedding (text-embedding-3-large @ 1536 dim): $0.13/1M token
- Generation (gpt-4o): $5/1M in + $20/1M out
- Verifier (gpt-4o-mini): $0.15/1M in + $0.60/1M out

Tahmini per-ask maliyet: **~$0.025** (3-5 kuruş). İlk ingest (~5000 chunk ×
~500 token) ≈ $0.30.

## 15. Tamamlandı kontrol listesi (Codex bunu yaptıktan sonra)

- [ ] Prisma migration uygulandı, `KbDocument`, `KbChunk`, `KbAsk`,
      `KbChunkVec` tabloları var
- [ ] pgvector extension yüklü, HNSW index oluştu
- [ ] FTS tsvector + GIN index oluştu
- [ ] `server/lib/kb/` altında 7 modül var (chunker, embedder, sources/pdf,
      sources/docx, ingest, retrieve, ask, categorizer)
- [ ] `server/routes/kb.js` var, `app.js`'e mount edildi
- [ ] `server/routes/cases.js` POST endpoint'i categorize'ı çağırır
- [ ] `scripts/ingest-kb.js` çalışır, idempotent, resumable
- [ ] `src/components/kb/KnowledgeBaseCard.tsx` var
- [ ] `.env.example` güncel
- [ ] Tests: chunker, retrieve, ask için unit testler (mocked OpenAI)
- [ ] README'ye KB bölümü eklendi

---

## Önemli notlar — atlanmaması gereken detaylar

1. **Prisma'da BYTEA + pgvector ayrı tablo**: schema portability için bu zorunlu.
   `KbChunk.embedding` (Prisma'nın yönettiği) + `KbChunkVec.embedding`
   (raw SQL ile pgvector) birlikte tutulur. Tek transaction'da yazılır.

2. **content_tsv generated column**: Prisma migration'dan SONRA raw SQL
   olarak `ALTER TABLE ... ADD COLUMN ... GENERATED ALWAYS AS` ekle.
   Prisma bu kolonu görmeyecek (ignored), sadece raw SQL'de kullanılır.
   `simple` tokenizer kullan (Türkçe Snowball Postgres'te paketli değil
   ama `simple` aksan-insensitive arama için yeter; ileride `unaccent`
   extension ile sertleştirilebilir).

3. **Verifier prompt parafraz toleransı**: birebir kelime eşleşmesi ARAMA.
   "Anlamca aynı yeterli" diye explicit yaz, yoksa LLM aşırı katı davranır
   ve makul cümleleri siler.

4. **Categorize için var olan enum'lara YAPIŞ**: Yeni `CaseType` veya yeni
   `CasePriority` türetme — Prisma enum'ları sabit. LLM'in seçimini
   `Object.values(CaseType)` ile validate et, geçersizse `GeneralSupport`
   default.

5. **Ingest klasör yapısı multi-tenant**: `data/kb-sources/<companyId>/...`
   — yanlışlıkla şirket A'nın dökümanı şirket B'ye sızmasın. Script
   `--company` parametresini zorunlu yap.

6. **Rerank ZAMANI**: Her search'te değil, sadece `ask` flow'unda etkinleşsin
   (yoksa her debug arama da 1-2s gecikme).

7. **AIUsageLog companyId zorunlu**: mevcut `logAIUsage` zaten kontrol
   ediyor; ama biz embedding çağrılarını DA loglamak istersek `endpoint`
   alanına `'kb-embed'`, `'kb-ask'`, `'kb-categorize'` yaz.

8. **Türkçe diakritik**: `text-embedding-3-large` Türkçe'yi iyi handle eder,
   `unaccent` extension'ı **gerekli değil** vector için. FTS için
   isteğe bağlı: aramayı `ı/i`, `ş/s` ayrımına duyarsız yapar.

## Çalıştığında nasıl görünmeli

Bir agent vaka detayında "Bilgi Bankasında Ara" butonuna basıyor, "Rut
tanımını satış temsilcisine nasıl bağlarım?" yazıyor:

```
{
  "answer": "1. **Satış Ekibi → Tanımlamalar → Satış Temsilcisi** menüsüne gidin [3]\n2. Temsilcinin kartını açın\n3. 'Rut Bilgileri' tab'ına tıklayın [5]\n4. 'Yeni' butonuna basın\n5. 'Rut Kodu' alanından rutu seçin [3][5]\n6. **Başlangıç Tarihi, Bitiş Tarihi, Frekans, Frekans Birimi** doldurun [5]\n7. **Önemli**: 'Merkez Onaylı Rut İşlemleri Kullanılsın Mı?' parametresi aktifse onay akışına düşer [5]\n8. Kaydet",
  "citations": [
    { "number": 3, "title": "Satış Temsilcisi", "source_type": "pdf", "excerpt": "..." },
    { "number": 5, "title": "8.5.0.Farklar Dökümanı", "source_type": "pdf", "excerpt": "Satış Temsilcisi kartı, Rut bilgileri ekranı..." }
  ],
  "refused": false,
  "meta": {
    "totalLatencyMs": 4200,
    "modelUsed": "gpt-4o",
    "rerankUsed": true,
    "verifierUsed": true
  }
}
```

---

**SON**. Bu prompt'u Codex'e ver, dosyaları yarat, migration'ı uygula, ingest
çalıştır, smoke testler at. Sorun çıkarsa logla ve raporla.
