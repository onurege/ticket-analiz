# EnRoute KB API — v1 Dökümanı

> Varuna Case Management entegrasyonu için public REST API referansı.

## Base URL & Auth

```
Base URL:   https://what-jump-briefly-herald.trycloudflare.com
API Key:    sk-varuna-1cad442efab838131141a43869696be21efb2fb74e7ecf85
Tenant:     varuna
```

**Tüm istekler** (health hariç) `Authorization` header gerektirir:

```http
Authorization: Bearer sk-varuna-1cad442efab838131141a43869696be21efb2fb74e7ecf85
Content-Type: application/json
```

**Rate limit:** Tenant başına **120 istek/dakika**. Aşılırsa `429` + `Retry-After` header.

**Hata formatı (tüm endpoint'lerde):**
```json
{
  "error": {
    "message": "Açıklama metni",
    "status": 400,
    "details": [ /* opsiyonel zod issues */ ]
  }
}
```

| Status | Anlamı |
|---|---|
| 200 | OK |
| 400 | Geçersiz girdi (JSON parse, validation) |
| 401 | Auth eksik veya geçersiz |
| 403 | Yetki yok |
| 429 | Rate limit |
| 500 | Sunucu hatası |

---

## 1. `GET /api/v1/health`

**Public** (auth yok). Sistem sağlığı + KB durumu.

**Curl:**
```bash
curl https://what-jump-briefly-herald.trycloudflare.com/api/v1/health
```

**Response 200:**
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
  "timestamp": "2026-05-20T15:19:59.982Z"
}
```

---

## 2. `GET /api/v1/stats`

Tenant-scoped KB istatistikleri.

**Curl:**
```bash
curl -H "Authorization: Bearer sk-varuna-1cad442efab838131141a43869696be21efb2fb74e7ecf85" \
  https://what-jump-briefly-herald.trycloudflare.com/api/v1/stats
```

**Response 200:**
```json
{
  "tenant": "varuna",
  "documents": 815,
  "chunks": 6564,
  "embeddings": 6564,
  "embedding_coverage": 1.0,
  "by_type": {
    "pdf": 37,
    "panorama_screen": 440,
    "ticket_resolution": 338
  },
  "last_ingest_at": "2026-05-17 12:45:44"
}
```

---

## 3. `POST /api/v1/kb/ask`  ⭐ ANA RAG ENDPOINT

Halisünasyon-savar RAG generation. Bir soru alır, KB'de arar, alıntılı cevap üretir.

**Request body:**

| Alan | Tip | Default | Açıklama |
|---|---|---|---|
| `query` | string | zorunlu | 3-2000 karakter |
| `topK` | int | 8 | En alakalı N chunk getir |
| `rerank` | bool | true | LLM ile rerank (1-2s ekstra, kalite ↑) |
| `verify` | bool | true | Verifier pass — desteklenmeyen cümleleri sil |
| `strictness` | enum | "normal" | `lenient` \| `normal` \| `strict` — refusal eşiği |
| `sourceTypes` | string[] | tümü | Filtre: `["pdf"]`, `["panorama_screen"]`, `["ticket_resolution"]` |

**`strictness` davranışı:**
- `strict` → Kaynaklarda direkt geçmeyen tüm cümleler atılır, çoğu zaman refused
- `normal` → Parafraz OK ama belirsiz cümleler atılır (üretim için)
- `lenient` → Parafraza geniş tolerans (test/keşif için) — **önerilen başlangıç**

**Curl:**
```bash
curl -X POST https://what-jump-briefly-herald.trycloudflare.com/api/v1/kb/ask \
  -H "Authorization: Bearer sk-varuna-1cad442efab838131141a43869696be21efb2fb74e7ecf85" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Rut tanımını satış temsilcisine nasıl bağlarım?",
    "topK": 12,
    "rerank": true,
    "verify": true,
    "strictness": "lenient"
  }'
```

**Response 200 (başarılı):**
```json
{
  "query": "Rut tanımını satış temsilcisine nasıl bağlarım?",
  "answer": "1. **Satış Ekibi → Tanımlamalar → Satış Temsilcisi** menüsüne gidin [3]\n2. İlgili temsilcinin kartını açın\n3. **Rut Bilgileri** sekmesine tıklayın [5]\n4. **Yeni** butonuna basın → **Rut Kodu** alanından rutu seçin...",
  "citations": [
    {
      "number": 3,
      "chunk_id": 1493,
      "doc_id": "screen:SatisTemsilcisi",
      "source_type": "panorama_screen",
      "title": "Satış Temsilcisi",
      "heading_path": "EnRoute Panorama > Satış Ekibi > Tanımlamalar — Satış Temsilcisi",
      "excerpt": "Rut Kodu: Belirtilen tanımın hangi rut için uygulanacağının seçildiği alandır..."
    },
    {
      "number": 5,
      "chunk_id": 5430,
      "doc_id": "docx:8-5-0-farklar-dokumani",
      "source_type": "pdf",
      "title": "8.5.0.Farklar Dökümanı",
      "heading_path": "Toplu Rut Silme",
      "excerpt": "Satış Temsilcisi kartı, Rut bilgileri ekranından rut frekans ve tanım silinebilmesi..."
    }
  ],
  "refused": false,
  "reason": null,
  "meta": {
    "retrievalLatencyMs": 1280,
    "generationLatencyMs": 14200,
    "verifierLatencyMs": 5400,
    "totalLatencyMs": 20880,
    "modelUsed": "claude-sonnet-4-5",
    "rerankUsed": true,
    "verifierUsed": true
  }
}
```

**Response 200 (refused — yeterli kaynak yok):**
```json
{
  "query": "Mars'ta yağmur var mı",
  "answer": "",
  "citations": [],
  "refused": true,
  "reason": "Verilen kaynaklarda bu konuyla ilgili bilgi bulunmamaktadır.",
  "meta": { "totalLatencyMs": 1200, "modelUsed": "claude-sonnet-4-5" }
}
```

**Önerilen kullanım — Varuna BFF'inde:**
```javascript
const result = await fetch(`${KB_BASE}/api/v1/kb/ask`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${KB_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: userQuestion, strictness: 'lenient' }),
}).then(r => r.json());

if (result.refused) {
  // UI'da "AI dökümantasyonda yanıt bulamadı" göster
} else {
  // result.answer Markdown formatında, citations array ile render et
}
```

---

## 4. `POST /api/v1/kb/search`

Sadece retrieval (generation yok). Debug için ve "ne tür chunk'lar geliyor" görmek için.

**Request body:**
```json
{
  "query": "e-fatura gönderim hatası",
  "topK": 10,
  "rerank": false,
  "sourceTypes": ["pdf"]
}
```

**Curl:**
```bash
curl -X POST https://what-jump-briefly-herald.trycloudflare.com/api/v1/kb/search \
  -H "Authorization: Bearer sk-varuna-1cad442efab838131141a43869696be21efb2fb74e7ecf85" \
  -H "Content-Type: application/json" \
  -d '{"query":"e-fatura gönderim hatası","topK":5}'
```

**Response 200:**
```json
{
  "query": "e-fatura gönderim hatası",
  "hits": [
    {
      "chunk_id": 4521,
      "doc_id": "docx:7-28-0-farklar-dokumani",
      "source_type": "pdf",
      "title": "7.28.0.Farklar Dökümanı",
      "heading_path": "E-Belge Süreçleri > E-Fatura Gönderim",
      "content": "E-fatura gönderim hatası tipik olarak...",
      "bm25Score": 0.333,
      "vecScore": 0.412,
      "rrfScore": 0.0321,
      "rerankScore": null
    }
  ]
}
```

---

## 5. `POST /api/v1/categorize`  ⭐ OTOMATIK KATEGORIZASYON

Bir vaka açıklamasını canonical taksonomi içine kategorize eder. Yeni vaka oluştururken çağırın.

**Request body:**

| Alan | Tip | Açıklama |
|---|---|---|
| `description` | string (zorunlu) | Vaka/sorun açıklaması, 5-8000 char |
| `project` | string (opsiyonel) | Müşteri/proje adı (örn. "NESTLE") |
| `customer_name` | string (opsiyonel) | Müşteri ismi |

**Curl:**
```bash
curl -X POST https://what-jump-briefly-herald.trycloudflare.com/api/v1/categorize \
  -H "Authorization: Bearer sk-varuna-1cad442efab838131141a43869696be21efb2fb74e7ecf85" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Müşteri e-fatura iptal etmek istiyor ama hata alıyor",
    "project": "NESTLE"
  }'
```

**Response 200:**
```json
{
  "category_id": "ebelge",
  "category_sub": "İptal/İade",
  "root_cause_id": "software-defect",
  "root_cause_sub": "Arayüz Hatası",
  "confidence": 0.75,
  "reason": "E-fatura iptal işlemi sırasında hata alınması, sistem tarafında bir işlem hatası veya arayüz sorunu göstergesidir."
}
```

**Mevcut kategoriler:**

| `category_id` | İsim | Alt kategoriler |
|---|---|---|
| `ebelge` | E-Belge | E-Fatura Gönderim, E-Arşiv, E-İrsaliye, GİB Entegrasyon, İptal/İade |
| `tahsilat` | Tahsilat & POS | Payneos SoftPos, ParamPOS, Banka Entegrasyon, Tahsilat Kaydı, Cari Eşleştirme |
| `mobil` | Mobil Uygulama | Android, iOS, El Terminali, Senkronizasyon, Saha Operasyon |
| `web` | Web / Backoffice | Login/Yetki, Arayüz, Performans, Bildirim, Genel UI |
| `raporlama` | Raporlama & Dashboard | Satış Raporu, Tahsilat Raporu, MTD/YTD, Hedef/Performans, Dashboard |
| `entegrasyon` | Entegrasyonlar | Logo, Netsis, Maya, ERP Diğer, API |
| `tanim` | Tanımlar | Müşteri Tanım, Ürün Tanım, Personel/Rut, Kampanya/İskonto, Genel Tanım |
| `satis-surec` | Satış Süreci | Sipariş, İrsaliye, Fatura, İade, Teklif |
| `stok` | Stok & Depo | Stok Hareketi, Depo İşlemi, Sayım, Transfer, Bakiye |
| `kullanici` | Kullanıcı & Yetki | Kullanıcı Yönetimi, Yetki Tanımı, Parametre, Şube/Depo |
| `veri-aktarim` | Veri & Aktarım | Excel Import/Export, Toplu İşlem, Migration, Yedekleme |
| `diger` | Diğer | Genel Soru, Eğitim Talebi, İyileştirme Önerisi, Bilinmeyen |

**Mevcut kök nedenler:**

| `root_cause_id` | İsim | Genelde |
|---|---|---|
| `user-error` | Kullanıcı Hatası | L1 |
| `configuration` | Konfigürasyon / Parametre | L1 |
| `permission` | Yetki / Erişim | L1 |
| `data` | Veri Sorunu | L1 |
| `software-defect` | Yazılım Hatası (Bug) | **L2** |
| `integration` | Entegrasyon / 3. Parti | **L2** |
| `performance` | Performans | **L2** |
| `environment` | Ortam / Altyapı | L1 |
| `process` | Süreç / İş Kuralı | L1 |
| `documentation` | Doküman/Bilgi Eksikliği | L1 |
| `feature-request` | Özellik Talebi | **L2** |
| `known-issue` | Bilinen Sorun | L1 |
| `other` | Diğer | L1 |

`confidence < 0.5` ise atamayı manuel kontrol etmenizi öneririm. `category_id="diger"` + `confidence=0` döndüyse LLM kategorize edemedi.

---

## 6. `POST /api/v1/analyze`

Tam ticket analizi — kategorize + AI önerileri + KB grounding tek atışta. **Süre 15-30s.**

**Request body:**

| Alan | Tip | Açıklama |
|---|---|---|
| `freeText` | string (zorunlu) | Sorun açıklaması, min 3 char |
| `project` | string (opsiyonel) | Proje adı |
| `bildirimNo` | int (opsiyonel) | Mevcut ticket no — eski sistem entegrasyonu için |

**Curl:**
```bash
curl -X POST https://what-jump-briefly-herald.trycloudflare.com/api/v1/analyze \
  -H "Authorization: Bearer sk-varuna-1cad442efab838131141a43869696be21efb2fb74e7ecf85" \
  -H "Content-Type: application/json" \
  -d '{
    "freeText": "Müşteri rut atayamıyor, kaydet butonuna bastığında hata veriyor",
    "project": "NESTLE"
  }'
```

**Response 200 (kısaltılmış):**
```json
{
  "analysisId": "tk-2026-05-20-abc123",
  "matched": null,
  "input": { "bildirimNo": null, "freeText": "...", "project": "NESTLE" },
  "similar": [
    {
      "bildirim_no": 31234567,
      "score": 0.82,
      "kategori_uzun": "Rut Tanımlama",
      "kok_neden": "Kullanıcı Hatası",
      "aciklama": "...",
      "cozum": "..."
    }
  ],
  "panoramaScreens": [
    {
      "id": "SatisTemsilcisi",
      "title": "Satış Temsilcisi",
      "menuStep": "Satış Ekibi → Tanımlamalar → Satış Temsilcisi",
      "fields": [],
      "buttons": []
    }
  ],
  "kbChunks": [
    { "number": 1, "source_type": "panorama_screen", "title": "...", "excerpt": "..." }
  ],
  "analysis": {
    "inferred": {
      "bildirim_tipi": "Hata",
      "oncelik": "Yüksek",
      "katman": "Backoffice",
      "kok_neden": "Kullanıcı Yetkisi Eksik",
      "confidence": 0.78
    },
    "rootCauseHypotheses": [
      { "text": "Kullanıcının rut atama yetkisi eksik olabilir", "confidence": 0.6 },
      { "text": "Rut tanımı sistemde mevcut değil", "confidence": 0.3 }
    ],
    "suggestedSteps": [
      { "step": "Satış Ekibi → Tanımlamalar → Satış Temsilcisi menüsüne gidin", "rationale": "..." },
      { "step": "İlgili temsilcinin kartını açın", "rationale": null },
      { "step": "Rut Bilgileri sekmesine tıklayın", "rationale": "Rut atama buradan yapılır" }
    ],
    "customerReplyDraft": "Merhaba, ...",
    "engineeringHandoff": "Rut atama hatası: ...",
    "suggestedBugGroup": null,
    "suggestedTfsTip": null,
    "meta": { "modelUsed": "claude-sonnet-4-5", "latencyMs": 18500 }
  }
}
```

`/analyze` `/categorize` + `/kb/ask`'in birleşik versiyonu. Daha pahalı (20+ s, daha fazla token). Sade kategorize için `/categorize`'ı tercih edin.

---

## 7. `POST /api/v1/kb/ingest`

PDF/DOCX dosyaları yükle + KB'ye ingest et (chunk'la).

**Content-Type:** `multipart/form-data`

**Form alanları:**

| Alan | Tip | Açıklama |
|---|---|---|
| `files` | File[] | PDF/DOCX (multi, max 20 dosya, 50 MB/dosya) |
| `embedNow` | string | `"true"` → ingest sonrası embedding'i de hemen üret (yavaş) |

**Curl:**
```bash
curl -X POST https://what-jump-briefly-herald.trycloudflare.com/api/v1/kb/ingest \
  -H "Authorization: Bearer sk-varuna-1cad442efab838131141a43869696be21efb2fb74e7ecf85" \
  -F "files=@8.5.0.Farklar.docx" \
  -F "files=@7.28.0.Farklar.pdf" \
  -F "embedNow=true"
```

**Response 200:**
```json
{
  "tenant": "varuna",
  "ingested": [
    {
      "file": "8.5.0.Farklar.docx",
      "doc_id": "docx:8-5-0-farklar",
      "chunks": 75,
      "tokens": 8784,
      "changed": true
    },
    {
      "file": "7.28.0.Farklar.pdf",
      "doc_id": "pdf:7-28-0-farklar",
      "chunks": 91,
      "tokens": 18285,
      "changed": false
    }
  ],
  "errors": [],
  "embeddings_run": {
    "embedded": 75,
    "skipped": 0,
    "durationMs": 32100
  }
}
```

`changed: false` → dosya zaten ingest edilmiş, hash değişmemiş, atlandı (idempotent).

---

## Varuna BFF — Tam Entegrasyon Örneği

```javascript
// server/lib/kbClient.js
const KB_BASE = process.env.KB_API_BASE; // tunnel URL'ini buraya yaz
const KB_KEY = process.env.KB_API_KEY;

async function kbCall(path, body, opts = {}) {
  const res = await fetch(`${KB_BASE}${path}`, {
    method: opts.method ?? 'POST',
    headers: {
      'Authorization': `Bearer ${KB_KEY}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = new Error(err.error?.message ?? `KB API ${res.status}`);
    e.status = res.status;
    throw e;
  }
  return res.json();
}

export const kbAsk = (query, opts = {}) =>
  kbCall('/api/v1/kb/ask', {
    query,
    topK: 12,
    rerank: true,
    verify: true,
    strictness: 'lenient',
    ...opts,
  });

export const kbCategorize = (description, project) =>
  kbCall('/api/v1/categorize', { description, project });

export const kbAnalyze = (freeText, project) =>
  kbCall('/api/v1/analyze', { freeText, project });

export const kbStats = () => kbCall('/api/v1/stats', null, { method: 'GET' });
```

```javascript
// server/routes/cases.js
import { kbCategorize, kbAsk } from '../lib/kbClient.js';

// Yeni vaka — otomatik kategorize
router.post('/', verifyJwt, async (req, res) => {
  const { description, project, ...rest } = req.body;

  // Kategorize (silent fail OK, vaka yine açılsın)
  const cat = await kbCategorize(description, project).catch((err) => {
    console.warn('[kb] categorize fail:', err.message);
    return null;
  });

  const created = await prisma.case.create({
    data: {
      ...rest,
      description,
      companyId: req.user.companyId,
      // AI kategorize sonuçları (Case modeline ekle):
      aiCategoryId: cat?.category_id,
      aiCategorySub: cat?.category_sub,
      aiRootCauseId: cat?.root_cause_id,
      aiRootCauseSub: cat?.root_cause_sub,
      aiCategoryConfidence: cat?.confidence,
      aiCategoryReason: cat?.reason,
    },
  });

  res.json({
    case: created,
    warnings: { categorize: cat ? null : 'Otomatik kategorize başarısız' },
  });
});

// Vaka detayında "Bilgi Bankasında Ara" butonu
router.post('/:id/kb-ask', verifyJwt, async (req, res) => {
  const caseObj = await prisma.case.findUnique({
    where: { id: req.params.id, companyId: req.user.companyId },
  });
  if (!caseObj) return res.status(404).json({ error: 'Vaka yok' });

  const query = req.body.query?.trim() || caseObj.description;
  if (!query || query.length < 5) {
    return res.status(400).json({ error: 'Sorgu en az 5 karakter olmalı' });
  }

  try {
    const result = await kbAsk(query);
    res.json(result);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
});
```

```bash
# .env (Varuna BFF)
KB_API_BASE=https://what-jump-briefly-herald.trycloudflare.com
KB_API_KEY=sk-varuna-1cad442efab838131141a43869696be21efb2fb74e7ecf85
```

---

## Postman Collection (kopyala-yapıştır)

`Postman → Import → Raw Text` ile import edin:

```json
{
  "info": { "name": "EnRoute KB API v1", "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
  "auth": {
    "type": "bearer",
    "bearer": [{ "key": "token", "value": "sk-varuna-1cad442efab838131141a43869696be21efb2fb74e7ecf85", "type": "string" }]
  },
  "variable": [
    { "key": "base_url", "value": "https://what-jump-briefly-herald.trycloudflare.com/api/v1" }
  ],
  "item": [
    {
      "name": "Health",
      "request": { "method": "GET", "url": "{{base_url}}/health", "auth": { "type": "noauth" } }
    },
    {
      "name": "Stats",
      "request": { "method": "GET", "url": "{{base_url}}/stats" }
    },
    {
      "name": "KB Ask",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/kb/ask",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"query\": \"Rut tanımını satış temsilcisine nasıl bağlarım?\",\n  \"topK\": 12,\n  \"rerank\": true,\n  \"verify\": true,\n  \"strictness\": \"lenient\"\n}"
        }
      }
    },
    {
      "name": "KB Search",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/kb/search",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": { "mode": "raw", "raw": "{\"query\":\"e-fatura gönderim\",\"topK\":5}" }
      }
    },
    {
      "name": "Categorize",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/categorize",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"description\": \"Müşteri e-fatura iptal etmek istiyor ama hata alıyor\",\n  \"project\": \"NESTLE\"\n}"
        }
      }
    },
    {
      "name": "Analyze (Full Pipeline)",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/analyze",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"freeText\": \"Müşteri rut atayamıyor\",\n  \"project\": \"NESTLE\"\n}"
        }
      }
    }
  ]
}
```

---

## Tipik Akış (Varuna Operatör Perspektifi)

```
1. Yeni vaka oluşturulur
        ↓
2. Varuna BFF → POST /api/v1/categorize
        ↓ ~3-5s
3. Vaka kayda alınır (kategori + kök neden ile)
        ↓
4. Operatör "Bilgi Bankasında Ara" butonuna basar
        ↓
5. Varuna BFF → POST /api/v1/kb/ask
        ↓ ~15-25s
6. Alıntılı cevap UI'da görünür
        ↓
7. Operatör çözümü tamamlar, vaka kapatılır
```

---

## Önemli Notlar

| | |
|---|---|
| **Tunnel ömrü** | Mac açık + WiFi'de olduğu sürece çalışır. URL Mac kapanınca ölür ve yeniden açıldığında **değişir**. |
| **Üretim için** | `DEPLOYMENT.md`'deki Hetzner adımları ile sabit URL'e geçin (`https://X-X-X-X.nip.io`) |
| **Maliyet (tahmini)** | Her `kb/ask` ~$0.025, her `categorize` ~$0.003, her `analyze` ~$0.05 |
| **Veri izolasyonu** | Tüm KB sorguları `tenant_id='varuna'` ile filtrelenir. Multi-tenant'a hazır |
| **CORS** | Tüm origin'lere açık (test için). Production'da `CORS_ALLOWED_ORIGINS` env ile kısıtlanır |
| **Idempotency** | `kb/ingest` aynı dosyayı tekrar yüklerse hash kontrolü ile atlar (`changed: false`) |
