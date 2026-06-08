# EnRoute Destek Merkezi

Ticket analizi, kök neden tespiti ve çözüm önerisi üreten dashboard. EnRoute
ürünündeki bildirimleri (`VIEW_BILDIRIM_AI_ANALIZ_DATA`) tek view üzerinden,
**read-only** olarak okur. Geçmiş ticket-çözüm çiftleri üzerinde retrieval +
few-shot LLM analiziyle:

- Bildirim numarası veya serbest sorun metni girilince,
- benzer geçmiş kayıtları (kosinüs embedding araması) bulur,
- kök neden hipotezleri + adım adım çözüm + müşteri yanıt taslağı +
  mühendislik özeti üretir,
- destek temsilcisi tek tıkla "çözdü / çözmedi / yazılıma aktar" işaretler;
  son seçenek `data/handoffs/<id>.md` çıktısını üretir.

## Kurulum

```bash
npm install --legacy-peer-deps
cp .env.example .env             # değerleri doldur (MSSQL + GEMINI_API_KEY)
npx tsx scripts/sync-and-embed.ts # ilk seferde uzun (snapshot + embedding)
npm run dev                      # http://localhost:3000/support
```

## Komutlar

| | |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Production sunucu |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit testler (10 dosya / 64 case) |
| `npx tsx scripts/sync-and-embed.ts` | Lokal snapshot + embedding üretici (resumable, artımlı) |
| `npx tsx scripts/smoke-resolver.ts <bildirimNo?>` | MSSQL bağlantı + guard smoke testi |

`sync-and-embed.ts` flag'leri:
- `--days N` — kaç günlük geçmiş çekilsin (default: env'deki `TICKET_ANALYSIS_LOOKBACK_DAYS`)
- `--skip-embed` — sadece içerik sync, embedding üretme
- `--max-embed N` — bu run'da en fazla N vektör üret (default 5000)
- `--page-size N` — view'dan sayfa boyutu (default 500)

## Güvenlik

- MSSQL erişimi sadece tek view: `dbo.VIEW_BILDIRIM_AI_ANALIZ_DATA`.
- Tablo/kolon adları [src/lib/ticket/source.ts](src/lib/ticket/source.ts)
  allowlist'inde sabit; identifier regex (`^[A-Za-z_][A-Za-z0-9_.]{0,63}$`)
  ile validate edilir.
- Değerler hiçbir zaman string concat ile geçmez — tümü
  `request.input(name, type, value)` ile bind.
- Read-only guard ([src/lib/db.ts](src/lib/db.ts) `assertReadOnly`) yorum
  strip sonrası `INSERT/UPDATE/DELETE/DROP/ALTER/CREATE/TRUNCATE/MERGE/EXEC/GRANT/REVOKE/DENY`,
  `... INTO yeni_tablo`, çoklu ifade pattern'lerini reddeder. 18 unit test
  ile pinlenmiştir.
- LLM'e giden metinde PII redaction (TC/IBAN/kart/telefon/email/uzun-sayı)
  uygulanır.

## Mimari

```
Dashboard (/support)
   │
   ▼ POST /api/tickets/analyze
src/lib/ticket/index.ts (runAnalysis)
   ├─ resolver.getById         lokal sqlite (hızlı), düşerse view (yavaş)
   ├─ similarity.searchSimilarByText  Gemini embed + kosinüs kNN
   ├─ taxonomy.loadTaxonomy    distinct etiket setleri (lokal)
   ├─ analyst.runAnalyst       tek Gemini JSON çağrısı
   └─ storage.saveAnalysis     data/ticket-analysis/<id>/
```

## Klasörler

- `src/app/` — Next.js App Router
  - `support/` — UI sayfaları (analiz, kümeler, çözüm bankası)
  - `api/tickets/analyze` — POST analiz
  - `api/tickets/[bildirimNo]` — GET tek kayıt
  - `api/tickets/clusters` — GET kümeleme
  - `api/solutions/search` — GET arama, POST yeni
  - `api/solutions/feedback` — POST feedback + handoff
- `src/lib/db.ts` — MSSQL pool + read-only guard
- `src/lib/gemini.ts` — embed + generate (retry/fallback)
- `src/lib/ticket/` — analiz pipeline (16 modül)
- `src/components/ui/` — base UI (Card/Button/Badge/Spinner/Navbar)
- `src/components/support/` — analize özel componentler
- `data/` — runtime artefaktları (gitignored runtime dirs):
  - `ticket-analysis/<id>/` — her analiz için meta+input+analysis+feedback
  - `handoffs/<id>.md` — "Yazılıma aktar" çıktıları
  - `solutions/<id>/` — yerli çözüm bankası
  - `embeddings.sqlite` — ticket snapshot + embedding cache (better-sqlite3)

## Operasyonel notlar

- **View ağırlığı**: `VIEW_BILDIRIM_AI_ANALIZ_DATA` tek-kayıt çekiminde
  ~15–25s sürer. Runtime'da bu yavaşlığı kullanıcı görmesin diye lokal
  sqlite snapshot tutuyoruz. Production'da `sync-and-embed.ts` cron ile
  her gece çalıştırılmalı (örn. günde 2 kez, son 7 gün için artımlı).
- **Embedding modeli**: `gemini-embedding-001` (3072 dim). Model değişirse
  `embeddings` tablosundaki `model` alanı eşleşmediği için kayıtlar yeniden
  üretilir; sync script otomatik olarak handle eder.
- **LLM yanıt süresi**: gemini-2.5-flash ile analiz başına ~12–20s.

## Bilgi Bankası Özeti (Bilinen Sorunlar)

Tekil analiz yanında, aynı türden gelen ticket'ları **bütün halinde** ele alan
bir akış var. `/support/clusters` üzerinden bir kümeye tıkla → detay sayfasında
**Sentez Üret** butonu:

- Kümeye ait tüm ticket'ları topla — açıklama + uygulanmış çözüm.
- **Deterministik üreteç** (LLM yok, ~25–50ms):
  - Açıklamalardan n-gram (2–4) distinct-document frekansıyla **karakteristik müşteri ifadeleri**.
  - Çözüm açıklamalarındaki cümleleri Türkçe stem + Jaccard ≥ 0.45 ile gruplayıp **kanonik çözüm adımları** — her biri kaç kayıtta gözlendiği + örnek `#Bildirim_No`'larla.
  - Sub-aggregation (kategori_uzun / kok_neden) ile **alt varyantlar**.
  - Severity dağılımı, proje listesi, ilk/son tarih.
  - Tek kayıtta gözlenen alternatif çözümler **edge case** olarak listelenir.
- LLM'e gitmediği için **deterministik, tekrarlanabilir, ücretsiz, sıfır gecikme**.
- Sonuç `data/known-issues/<id>/` altında saklanır (deterministik id;
  yeniden üretim üzerine yazar). `/support/known-issues` sayfası tüm
  sentezleri listeler.

API:
- `POST /api/synthesis { groupBy, groupKey, sampleSize?, force? }`
- `GET /api/synthesis?groupBy=X&groupKey=Y` (varsa kayıt) veya `?limit=N` (liste)
- `GET /api/synthesis/[id]`

## Çağrı Merkezi (CC)

Sistemin çağrı merkezi modu — gerçek ticket kayıt + iş akışı sistemi olarak
çalışır. Auth, roller, otomatik kategorizasyon, atama, escalation içerir.

### Kullanıcı rolleri

| Rol | Görür | Yapabilir |
|---|---|---|
| **super_admin** | Tüm ticket'lar | Kullanıcı yönetimi (`/admin/users`), her şey |
| **L1_agent** | Kendine atanan + L1 havuzu (atanmamış) | Ticket aç, üstlen, çöz, L2'ye devr |
| **L1_lead** | Tüm L1 ticket'ları | + L1'e atama, takım görünürlük |
| **L2_agent** | Kendine atanan + L2 havuzu (escalate edilmiş) | Çöz, başka L2'ye ata, L1'e geri gönder |
| **L2_lead** | Tüm L1 + L2 ticket'ları | + Cross-team atama, escalation analiz |

### İlk kurulum

```bash
# 1) Auth secret üret
echo "CC_SESSION_SECRET=$(openssl rand -hex 32)" >> .env

# 2) Süper admin oluştur (interaktif)
npx tsx scripts/init-super-admin.ts
# → email, ad, parola sorulur

# 3) Dev server'ı yeniden başlat
npm run dev

# 4) http://localhost:3002/login → süper admin ile giriş
# 5) /admin/users → diğer kullanıcıları (L1/L2) oluştur
```

### Ticket akışı

```
Yeni Ticket (L1 açar)
  ├─ "Analiz Et ve Aç" → AI runAnalysis çalışır (~15-20s) → ticket detayda
  │                       AI önerileri görünür, customerReplyDraft ile
  │                       çözüm pre-fill edilir
  └─ "Hızlı Kayıt"      → Anında ticket açılır, AI yok; detay sayfasından
                          sonradan "AI Analiz Çalıştır" ile tetiklenebilir
       │
       ▼  (her iki durumda da otomatik LLM kategorizasyon)
  Otomatik kategorize edilir → kategori + alt + kök neden + alt
  (data/cc-taxonomy.json + data/cc-root-causes.json içinden seçilir)
       │
       ▼
  L1 Havuzunda görünür (status=open, assigned_to=null)
       │
       ▼  (bir L1 agent "Üstlen" der veya Lead atar)
  L1 Agent üstüne alır (status=in_progress, assigned_to=agent)
       │
       ├─→ L1 çözer → "Çöz ve Kapat" (status=closed)
       │
       └─→ L1 çözemez → "L2'ye Devr Et"
                          │
                          ▼
                     L2 Havuzu (assigned_to=null, escalated_to_role=L2)
                          │
                          ├─→ L2 üstlenir → çözer → kapatır
                          └─→ L2 çözemez/yanlış → "L1'e Geri Gönder"
```

### Kategorizasyon

İki canonical taksonomi `data/` altında JSON olarak tutulur:

| Dosya | İçerik |
|---|---|
| `cc-taxonomy.json` | 12 ana kategori × 4-5 alt = ~50 kategori (E-Belge, Tahsilat, Mobil…) |
| `cc-root-causes.json` | 13 ana kök neden × 4 alt = ~50 kök neden (Kullanıcı Hatası, Konfigürasyon, Yazılım Bug…) |

LLM **sadece bu listelerden** seçer — yeni kategori uydurması engelli
(`isValidCategory` / `isValidRootCause` ile doğrulanır, geçersizse
`diger / other` fallback).

Süper admin'in JSON'ları düzenlemesi yeterli; cache (`taxonomy.ts`) her
process restart'ta yeniden yükler.

### CC API endpoint'leri

| Endpoint | Yetki | Açıklama |
|---|---|---|
| `POST /api/cc-tickets` | Auth | Yeni ticket. Body: `{ description, customer_name?, project?, channel?, mode: "analyze"\|"quick" }` |
| `GET /api/cc-tickets` | Auth | Liste (rol-filtreli) |
| `GET /api/cc-tickets/[id]` | Auth + erişim | Detay + event log |
| `PATCH /api/cc-tickets/[id]` | Auth + erişim | `agent_resolution` günceller |
| `POST /api/cc-tickets/[id]/assign` | Auth + erişim | Body: `{ user_id?: number }` (yok ise kendine) |
| `POST /api/cc-tickets/[id]/escalate` | Auth + erişim | L2 havuzuna gönder |
| `POST /api/cc-tickets/[id]/deescalate` | Auth + erişim | L1 havuzuna geri gönder |
| `POST /api/cc-tickets/[id]/close` | Auth + erişim | Body: `{ resolution: string }` |
| `POST /api/cc-tickets/[id]/analyze` | Auth + erişim | Sonradan AI tetikle |
| `GET/POST/PATCH/DELETE /api/admin/users[/...]` | super_admin | Kullanıcı CRUD |
| `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` | Anonim/Auth | Session |

### CC DB tabloları (data/embeddings.sqlite)

| Tablo | İçerik |
|---|---|
| `cc_users` | id, email, name, role, password_hash, active |
| `cc_sessions` | token_hash, user_id, expires_at (iron-session backing) |
| `cc_tickets` | id, ticket_no, status, customer, category, root_cause, AI, çözüm, atama |
| `cc_ticket_events` | Audit log (created, assigned, escalated, closed…) |
| `cc_counters` | ticket_no üretimi (CC-YYYY-NNNNNN) |

## Bilgi Bankası (RAG) Entegrasyonu

Halisünasyon-savar, alıntı-zorunlu Retrieval-Augmented Generation katmanı.
Üç kaynaktan döküman ingest eder, hibrit retrieval (BM25 + vector) +
grounded generation + verifier pass ile cevap üretir.

### Kaynaklar

| Kaynak | Konum | Connector |
|---|---|---|
| **PDF dökümanları** | `data/kb/pdfs/*.pdf` | `src/lib/kb/sources/pdf.ts` |
| **Panorama ekran kılavuzları** | `data/panorama-docs/screens.json` (440 ekran) | `src/lib/kb/sources/panorama-screens.ts` |
| **Çözülmüş ticket'lar** | Lokal sqlite snapshot (`tickets` tablosu, `cozum` dolu) | `src/lib/kb/sources/mssql.ts` |

### Mimari

```
PDF/HTML/MSSQL ─► chunker ─► kb_documents + kb_chunks
                                    │
                                    ▼ embed
                              kb_embeddings (BLOB)
                              kb_vec       (sqlite-vec virtual)
                              kb_chunks_fts (FTS5 virtual)
                                    │
                          ┌─────────┼─────────┐
                          │         │         │
                       BM25      vector    (filter)
                          │         │
                          └────RRF──┘
                              │
                       (opsiyonel) Gemini rerank
                              │
                       top-K chunks
                              │
                      strict grounding prompt
                              │
                          Gemini gen
                              │
                       verifier pass (Gemini)
                              │
                       refused | answer + citations
```

### İlk kurulum

```bash
# 1) data/kb/pdfs/ klasörüne PDF'leri kopyalayın:
mkdir -p data/kb/pdfs
cp /yol/to/dokümanlar/*.pdf data/kb/pdfs/

# 2) Önce mevcut ticket'lar lokal sqlite'a sync edilmiş olmalı:
npx tsx scripts/sync-and-embed.ts

# 3) KB ingestion (üç kaynağı da):
npx tsx scripts/ingest-kb.ts

# Veya sadece bir kaynak:
npx tsx scripts/ingest-kb.ts --pdfs
npx tsx scripts/ingest-kb.ts --screens
npx tsx scripts/ingest-kb.ts --tickets --tickets-limit 2000
```

### Kullanım

**UI'da:** Analiz paneli açılınca otomatik olarak top-5 KB chunk analyst'e
beslenir (öneriler bilgi bankasıyla grounded olur). Ayrıca "Bilgi
Bankasında Ara" butonu var → açıkça soru sorabilirsiniz.

**API:**

- `POST /api/kb/ask` — RAG generation, halisünasyon guard ile
  - Body: `{ query, topK?, sourceTypes?, rerank?, verify?, strictness? }`
  - Yanıt: `{ answer, citations[], refused, reason, meta }`
- `POST /api/kb/search` — sadece retrieval (debug için)
- `GET /api/kb/stats` — KB boyut + istatistikler

**CLI:**
```bash
# Bekleyen embedding'leri toplu işle (resumable)
npx tsx scripts/ingest-kb.ts --skip-embed=false --max-embed 10000

# İstatistik
curl http://localhost:3000/api/kb/stats | jq
```

### Halisünasyon-savar mekanizmalar

1. **Strict grounding** — system prompt "yalnızca kaynaklardan; yoksa
   refused:true"
2. **Citation enforcement** — yanıttaki her teknik iddia `[N]` alıntısı
   içermek zorunda; otomatik regex ile doğrulanır
3. **Confidence threshold** — top chunk RRF skoru `MIN_RRF_SCORE`
   eşiğinin altıysa generation YAPILMAZ, refused dönülür
4. **Verifier pass** — 2. Gemini çağrısı: cümle-cümle "kaynaklarda
   gerçekten var mı" doğrular; desteklenmeyenler yanıttan silinir veya
   strict modda komple reddedilir (gemini-2.5-flash-lite, ucuz)
5. **Source diversity** — `sourceTypes` filtresi ile sadece belirli
   kaynak tipinden sorgu (örn. sadece `panorama_screen`)

### Şema

`data/embeddings.sqlite` içinde (mevcut DB'ye eklenir, dokunulmaz):

| Tablo | İçerik |
|---|---|
| `kb_documents` | doc_id, source_type, title, metadata_json, content_hash |
| `kb_chunks` | doc_id, ord, heading_path, content, token_count |
| `kb_embeddings` | chunk_id → vector BLOB (float32) |
| `kb_chunks_fts` | FTS5 virtual (content + heading_path, unicode61) |
| `kb_vec` | sqlite-vec virtual (chunk_id → FLOAT[3072]) |
| `kb_sync_state` | her connector için watermark |

### Performans notları

- **Chunk başına embed**: ~50–150ms (Gemini batch=16, concurrent=8)
- **Retrieval**: <500ms (BM25 + vec0 paralel + RRF)
- **Generation**: ~5–10s (gemini-2.5-flash, max 4k token)
- **Verifier**: ~3–5s (gemini-2.5-flash-lite, max 1k token)
- **Toplam ask**: 10–20s pratikte
- **Inline analyst için**: sadece retrieval (~0.5–1.5s), generation içerikten gelir

### Anlık denetim
- `GET /api/kb/stats` — kaç chunk var, embed'leri tamam mı
- Vector tablosu yoksa (sqlite-vec yüklenemediyse) keyword-only fallback
  ile çalışır; UI'da uyarı yok ama recall düşer

## NotebookLM Entegrasyonu (Opsiyonel)

Univera'nın iç dökümantasyonunu (Panorama sürüm notları, müşteri-projeleri özel
uyarlamalar, e-belge/tahsilat/raporlama detayları) Google NotebookLM üzerinden
ticket'lara çözüm önerisinde kullanma katmanı.

**Mimari:**

```
Analysis Panel (UI)  ──► POST /api/notebooklm/consult
                              │
                              ▼
                  src/lib/ticket/notebooklm.ts
                              │
                              ▼
                  src/lib/notebooklm/client.ts (singleton)
                              │
                              ▼  stdio JSON-RPC
                  npx -y notebooklm-mcp@latest (subprocess)
                              │
                              ▼  Chrome (Patchright, headless)
                  notebooklm.google.com (Gemini 2.5)
```

**İlk kurulum (tek seferlik):**

1. Claude Code / başka MCP istemcisinden `npx -y notebooklm-mcp@latest`
   bağlanıp `setup_auth` tool'unu çağır — açılan Chrome'da Google login
   yap. Cookie'ler `~/Library/Application Support/notebooklm-mcp/` altına
   kaydedilir, sonraki çalıştırmalarda otomatik kullanılır.
2. `add_notebook` tool'u ile NotebookLM share-URL'ini library'e ekle ve
   notebook id'sini öğren.
3. `.env`'de aşağıdaki değerleri ayarla:

```bash
NOTEBOOKLM_ENABLED=true
NOTEBOOKLM_NOTEBOOK_ID=univera-panorama-d-k-manlar
# Otomatik consult'ı her analize katmak istersen (yavaşlatır, +20-40s):
# NOTEBOOKLM_AUTO_CONSULT=true
```

**Kullanım:**

- **UI'dan opt-in (default)**: Analiz paneli açıldıktan sonra "Dökümantasyona
  Danış" butonuna tıkla. İlk cevap 15–60s, follow-up'lar daha hızlı (session
  reuse).
- **Pipeline'a inline**: `NOTEBOOKLM_AUTO_CONSULT=true` yap → her
  `/api/tickets/analyze` çağrısı NotebookLM'i paralel olarak da konsulte
  eder; cevap analiz sonucuna `notebookLm` alanında döner.

**API:**

- `POST /api/notebooklm/consult`
  - Body (ticket mode): `{ mode: "ticket", ticket: { bildirimNo, proje, kategori, kokNeden, aciklama }, sessionId? }`
  - Body (free mode): `{ mode: "free", question: "...", sessionId? }`
  - Yanıt: `{ question, answer, sessionId, notebookUrl, sources: [{marker, sourceName, sourceText}], latencyMs }`
- `GET /api/notebooklm/consult` — `{ enabled: bool }` health probe

**Operasyonel notlar:**

- Subprocess **singleton**: ilk çağrıda spawn edilir, sonraki çağrılar aynı
  bağlantıyı paylaşır. Process exit'inde otomatik reconnect (sıradaki çağrıda).
- **Headless Chrome**: notebooklm-mcp arka planda Patchright Chromium çalıştırır.
  Sunucu kapatılırsa Chrome de sonlanır.
- **Quota**: Free tier 50 sorgu/gün; Pro hesap 250.
- **Hata toleransı**: Auto-consult fail olursa baseline analiz çalışmaya
  devam eder, sadece `notebookLm=null` döner.
- **PII**: Ticket bağlamı NotebookLM'e gönderilmeden önce upstream
  `redactor` zaten temizlik yapmıyor (bu çağrı doğrudan); kritik PII içeren
  ticket'larda dikkatli ol — gerekirse `consultForTicket` öncesi redact ekle.

## Yol haritası

- [x] Faz 0 — iskelet, token paleti, base UI
- [x] Faz 1 — MSSQL pool + read-only guard + resolver
- [x] Faz 2 — embeddings + similarity + lokal snapshot + redactor + taxonomy
- [x] Faz 3 — classifier + analyst + storage + `/api/tickets/analyze`
- [x] Faz 4 — dashboard analiz paneli + componentler + feedback
- [x] Faz 5 — kümeler + çözüm bankası + handoff
- [x] Faz 6 — polish + docs
- [x] Faz 7 — pattern sentezi (bilinen sorunlar + kanonik çözüm üretimi)
- [x] Faz 8 — NotebookLM consult (iç dökümantasyona alıntılı çözüm önerisi) — *PASİF, KB sistemiyle değiştirildi*
- [x] Faz 9 — Knowledge Base RAG (sqlite-vec + FTS5 + hibrit retrieval + verifier guard)
- [x] Faz 10 — Çağrı Merkezi (auth + 5 rol + ticket kayıt + otomatik kategorizasyon + escalation)
- [x] Faz 11 — Gemini → Claude geçişi (generation: Sonnet/Haiku tier; embedding: lokal transformers.js, sıfır API)

## LLM Stack

| Görev | Provider | Model | Notlar |
|---|---|---|---|
| Generation — analyst, KB ask | Anthropic Claude | `claude-sonnet-4-5` | Kaliteli analiz, Türkçe iyi |
| Generation — verifier, categorize, rerank | Anthropic Claude | `claude-haiku-4-5` | `tier: "fast"` ile çağrılır, daha ucuz |
| Embedding | **Lokal** (transformers.js) | `Xenova/multilingual-e5-base` (768 dim) | İlk run model indirir (~300 MB), CPU'da ~0.4s/chunk, **sıfır API maliyeti** |

**Sadece 1 API key gerekli:** `ANTHROPIC_API_KEY`. OpenAI/Gemini/Voyage yok.

### Embedding modeli değiştirme

`.env`'de `LOCAL_EMBEDDING_MODEL` ve `LOCAL_EMBEDDING_DIM`:

```bash
# Default — hızlı + iyi
LOCAL_EMBEDDING_MODEL=Xenova/multilingual-e5-base
LOCAL_EMBEDDING_DIM=768

# Kaliteli (yavaş — ~2 saat re-embed)
# LOCAL_EMBEDDING_MODEL=Xenova/multilingual-e5-large
# LOCAL_EMBEDDING_DIM=1024

# Hızlı (kalite biraz düşer)
# LOCAL_EMBEDDING_MODEL=Xenova/multilingual-e5-small
# LOCAL_EMBEDDING_DIM=384
```

Model değiştirirseniz mevcut KB embedding'leri uyumsuz olur — `scripts/reset-kb-embeddings.ts` ile temizleyip `scripts/ingest-kb.ts` ile yeniden gömün.

## Sonraki iyileştirmeler (MVP dışı)

- Auth katmanı (NextAuth/SSO)
- Embedding cache için ANN index (büyük datasette)
- Feedback'lerden kalite ölçümü dashboard'u
- Çözüm bankası için embedding semantic search
- MCP transport ekleme (yazılım ekibinin IDE'sinden ulaşabilsin diye)
