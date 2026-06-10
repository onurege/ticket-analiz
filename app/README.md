# EnRoute Ticket App

Canlı N4B ticket dashboard'u — MSSQL'den otomatik veri çekme, kural-tabanlı
kategorize, ve drill-down detay görüntüleme.

## Mimari

```
┌──────────────┐   poll    ┌──────────────┐   write   ┌──────────────┐
│ N4B MSSQL    │ ◀──────── │  Ingestor    │ ────────▶ │ Local Cache  │
│ TBL_N4B_*    │  5 dk     │  (worker)    │           │  SQLite      │
└──────────────┘           └──────────────┘           └──────┬───────┘
                                                            │
                                                            ▼
┌──────────────┐  HTTP     ┌──────────────┐  HTTP     ┌──────────────┐
│  Web SPA     │ ◀──────── │   REST API   │ ◀──────── │   Cache DB   │
│ (Vite+React) │           │  (Fastify)   │           │              │
└──────────────┘           └──────────────┘           └──────────────┘
```

### Bileşenler

| Bileşen | Stack | Sorumluluk |
|---|---|---|
| **server/** | Node + TS + Fastify | API + Ingestor worker tek process |
| **server/src/db/mssql.ts** | `mssql` driver | N4B `TBL_N4B_COZUM_ACIKLAMALAR` connection |
| **server/src/db/cache.ts** | `better-sqlite3` | Local cache + categorized rows |
| **server/src/categorizer/** | Pure TS | Kural-tabanlı 7-alan sınıflandırma |
| **server/src/ingestor/** | `node-cron` | 5dk'da bir incremental fetch |
| **server/src/api/** | Fastify routes | REST endpoints |
| **web/** | Vite + React + TS | SPA dashboard + drill-down |

## Klasör yapısı

```
app/
├── README.md
├── .env.example
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── data/
│   │   └── taxonomy.json
│   └── src/
│       ├── index.ts
│       ├── config.ts
│       ├── db/
│       │   ├── mssql.ts
│       │   └── cache.ts
│       ├── categorizer/
│       │   ├── index.ts
│       │   ├── rules.ts
│       │   └── anonymize.ts
│       ├── ingestor/
│       │   └── index.ts
│       ├── api/
│       │   ├── stats.ts
│       │   └── tickets.ts
│       └── lib/
│           └── pareto.ts
└── web/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── routes/
        │   ├── Dashboard.tsx
        │   └── TicketDetail.tsx
        ├── components/
        │   ├── MetricGrid.tsx
        │   ├── BarChart.tsx
        │   ├── ParetoChart.tsx
        │   └── ...
        └── lib/
            └── api.ts
```

## Kurulum

### 1. Bağımlılıklar

```bash
cd app/server && npm install
cd ../web && npm install
```

### 2. Ortam değişkenleri

`app/.env.example` → `app/server/.env` kopyala:

```bash
cp .env.example server/.env
# server/.env'i düzenle (TICKET_MSSQL_* değerleri)
```

### 3. İlk fetch + dev

```bash
# Terminal 1 — backend (port 4000)
cd app/server && npm run dev

# Terminal 2 — frontend (port 5173)
cd app/web && npm run dev
```

İlk açılışta ingestor MSSQL'den son 90 günü çekip kategorize eder
(~30 sn). Sonra 5 dk'da bir incremental update.

## API

| Endpoint | Açıklama |
|---|---|
| `GET /api/stats` | Toplam, dağılımlar, Pareto, trend |
| `GET /api/tickets?page=1&limit=50&filter=...` | Filtreli ticket listesi |
| `GET /api/tickets/:bildirimNo` | Tek ticket detayı (tam metin + etiketler) |
| `GET /api/operators` | Operatör leaderboard |
| `GET /api/operators/:name` | Operatör profili |
| `GET /api/categories/:type/:key` | Kategoriye giren ticket'lar |
| `POST /api/refresh` | Manuel re-fetch tetikle |
| `GET /api/health` | DB sağlık kontrolü |

## Deploy (On-prem Windows Server)

### Sıfırdan kurulum (git clone)

```powershell
# 1. Repo'yu klonla
git clone https://github.com/onurege/ticket-analiz.git C:\enroute-rag
cd C:\enroute-rag\app

# 2. .env'leri hazırla
copy .env.example server\.env
# server\.env'i düzenle:
#   - TICKET_MSSQL_USER, TICKET_MSSQL_PASSWORD (N4B credentials)
#   - GEMINI_API_KEY (mevcut key)

# 3. Bağımlılıkları kur
cd server && npm install --omit=dev
cd ..\web && npm install

# 4. Build
cd ..\server && npm run build
cd ..\web && npm run build

# 5. Cache'i snapshot'tan oluştur (271 manuel-v3 ticket etiketleriyle)
cd ..\server
node scripts/restore-from-snapshot.mjs

# 6. Embedding'leri al (~100 sn, Gemini'ye 271 çağrı)
node scripts/bootstrap-embeddings.mjs

# 7. pm2 ile başlat
pm2 start dist/index.js --name enroute-rag
pm2 save
pm2 startup
```

### Erişim
- API + Web (tek port): `http://<server-ip>:4000`
- Health: `/api/health`
- Embeddings: `/api/health/embeddings`
- AI ile Önerle UI: `http://<server-ip>:4000/categorize`

### Yeni gelen ticket'lar için embedding (cron)

Ingestor 5dk'da bir N4B'den yeni ticket çeker, **embedding otomatik alınmaz**.

Windows Task Scheduler ile gece 02:00'de embed et:
```powershell
schtasks /Create /SC DAILY /ST 02:00 /TN "EnRouteEmbeddings" `
  /TR "node C:\enroute-rag\app\server\scripts\bootstrap-embeddings.mjs"
```

Script idempotent — sadece eksik olanları embed eder.

### EnRoute Destek "AI ile Önerle" Akışı

Knowledge Base'i kullanan "AI ile Önerle" butonu için endpoint:

```javascript
// Operatör "AI ile Önerle" tıkladığında — müşteri metnini KB'ye gönder
const r = await fetch('http://<server-ip>:4000/api/categorize', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ text: musteriMetni })
});
const { labels, confidence, reasoning, similarExamples } = await r.json();
// labels'ı 9 dropdown'a yerleştir, confidence göster
// similarExamples'ı "benzer geçmiş vakalar" panelinde göster
```

Operatör onaylayıp/düzeltip kaydettiğinde KB'yi besle:
```javascript
await fetch('http://<server-ip>:4000/api/feedback', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    sourceText: musteriMetni,
    aiSuggestion: aiOnerisi,            // AI'ın önerdiği etiketler
    finalLabels: kullanicininKaydettigi, // operatörün son kararı
    wasCorrected: aiOnerisi !== kullanicininKaydettigi
  })
});
// Her kaydet → KB büyür → sonraki "AI ile Önerle" daha doğru sonuç verir
```

**KB nasıl iyileşir?**
- Her feedback yeni "öğretmen örneği" → vector store'a eklenir
- Sonraki ticket geldiğinde bu örnek de benzerlik araması için kullanılır
- Aynı pattern bir kez doğru etiketlenince, sonrakileri de doğru yakalanır

Frontend `web/dist/` Fastify static middleware'i üzerinden servis edilir
(tek port: 4000). Reverse proxy / domain isteğe bağlı.

## Kategorizasyon

Hiç LLM API kullanılmaz. Kural seti `server/data/taxonomy.json`'da:

- 14 İş Süreci
- 13 İşlem Tipi
- 17 Etkilenen Nesne
- 3 Etki seviyesi (P1/P2/P4)
- 12 Kök Neden Grubu × ~80 Detay
- 8 Çözüm Tipi

Yeni keyword/kural eklemek için `server/src/categorizer/rules.ts` düzenle,
sonra `POST /api/refresh` tetikle — tüm cache yeniden kategorize edilir.

## Sürüm Notları

- **v0.1 (MVP)** — Dashboard + ticket detay sayfası
- v0.2 — Filtreli liste, operatör profil
- v0.3 — Kategori drill, RCA interaktif
- v0.4 — Alarm kuralları, export
