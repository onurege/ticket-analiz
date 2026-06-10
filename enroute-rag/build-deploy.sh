#!/bin/bash
# Production deploy paketi hazırla.
#
# Çıktı: /tmp/enroute-rag-deploy-<tarih>.zip
#
# İçinde:
#   server/dist/        (TS → JS build)
#   server/data/        (cache.sqlite ile embeddings)
#   server/package.json + package-lock.json
#   server/scripts/     (bootstrap & maintenance)
#   web/dist/           (Vite production build)
#   .env.example        (prod'da düzenlenecek)
#   README-DEPLOY.md    (kurulum talimatı)

set -e
cd "$(dirname "$0")"

ROOT=$(pwd)
STAGE=/tmp/enroute-rag-deploy
DATE=$(date +%Y%m%d-%H%M)
OUT="/tmp/enroute-rag-deploy-${DATE}.zip"

echo "=== 1. Server build ==="
cd "$ROOT/server"
npx tsc -p tsconfig.json
echo "✓ server/dist/"

echo ""
echo "=== 2. Web build ==="
cd "$ROOT/web"
npx vite build
echo "✓ web/dist/"

echo ""
echo "=== 3. Cache.sqlite checkpoint (WAL → main DB) ==="
cd "$ROOT/server"
# WAL'ı main DB'ye yaz, dosyayı taşınabilir hale getir
sqlite3 data/cache.sqlite "PRAGMA wal_checkpoint(TRUNCATE)" > /dev/null
echo "✓ cache.sqlite checkpoint"

echo ""
echo "=== 4. Stage dizini hazırla ==="
rm -rf "$STAGE"
mkdir -p "$STAGE/server/data" "$STAGE/server/scripts" "$STAGE/web"

# Server: dist, data, scripts, package files
cp -r "$ROOT/server/dist" "$STAGE/server/"
cp "$ROOT/server/data/cache.sqlite" "$STAGE/server/data/"
cp "$ROOT/server/data/taxonomy-v3.json" "$STAGE/server/data/"
cp "$ROOT/server/data/snapshot-v1.json" "$STAGE/server/data/" 2>/dev/null || true
cp "$ROOT/server/scripts/bootstrap-embeddings.mjs" "$STAGE/server/scripts/"
cp "$ROOT/server/package.json" "$STAGE/server/"
cp "$ROOT/server/package-lock.json" "$STAGE/server/"
cp "$ROOT/.env.example" "$STAGE/"

# Web: dist (static)
cp -r "$ROOT/web/dist"/* "$STAGE/web/"

echo "✓ Stage hazır: $STAGE"

echo ""
echo "=== 5. README-DEPLOY.md ==="
cat > "$STAGE/README-DEPLOY.md" <<'EOF'
# EnRoute RAG — Production Deploy

## İçindekiler
- `server/dist/` — Compiled TypeScript (Node.js çalıştırır)
- `server/data/cache.sqlite` — 271 ticket + embedding'leri DAHİL (~13 MB)
- `server/data/taxonomy-v3.json` — Kategori taxonomy'si
- `server/data/snapshot-v1.json` — Eski taxonomy snapshot'ı (v1 dashboard için)
- `server/scripts/` — Bakım scriptleri
- `server/package.json` — npm dependencies
- `web/` — Static React UI (Fastify tarafından serve edilir)
- `.env.example` — Ortam değişkenleri şablonu

## Kurulum (Windows Server, pm2 ile)

```powershell
# 1. Bu zip'i hedef makineye extract et (örn. C:\enroute-rag)
cd C:\enroute-rag

# 2. .env dosyasını oluştur (.env.example'dan kopyala)
cp .env.example server\.env
# server\.env'i editle:
#   - TICKET_MSSQL_USER, TICKET_MSSQL_PASSWORD (N4B credentials)
#   - GEMINI_API_KEY (mevcut key'i kopyala)
#   - PORT (default 4000, değiştirilebilir)

# 3. Production dependencies kur
cd server
npm install --omit=dev

# 4. pm2 ile başlat
pm2 start dist/index.js --name enroute-rag
pm2 save
pm2 startup  # Windows Server boot'unda otomatik başlasın
```

## Erişim

- API + Web (tek port): `http://<server-ip>:4000`
- Health: `http://<server-ip>:4000/api/health`
- Embeddings health: `http://<server-ip>:4000/api/health/embeddings`

## Embedding bootstrap GEREKLİ Mİ?

**HAYIR** — cache.sqlite içinde 271 ticket'ın embedding'leri zaten BLOB olarak duruyor.
Server başlar başlamaz tüm vector store hazır.

Bootstrap **sadece** şu durumlarda gerekli:
1. cache.sqlite'ı silersen
2. Yeni ticket'lar manuel kategorize edilip embed edilmek istenirse
3. Embedding modeli değişirse

Komut: `node scripts/bootstrap-embeddings.mjs` (idempotent — sadece eksik olanları embed eder).

## Yeni gelen ticket'lar

Server başlar başlamaz ingestor 5 dakikada bir N4B'den (`TBL_N4B_COZUM_ACIKLAMALAR`)
yeni ticket'ları çekiyor → rule-based ile ön-kategorize → cache'e yazıyor.

YENİ TİCKET'LAR İÇİN EMBEDDING OTOMATİK ALINMIYOR. İki seçenek:
- Periyodik bootstrap: `node scripts/bootstrap-embeddings.mjs` cron job (gece 1x)
- Veya feedback flow'undan: operatör onay/düzeltme yaptığında embedding hesaplanıyor

## Next4biz UI'a entegrasyon

Next4biz front-end'de "AI ile Önerle" butonu:
```javascript
// Eski (hatalı): kendi AI servisleri
const r = await fetch('/eski-ai-endpoint');

// Yeni: bizim RAG endpoint'imiz
const r = await fetch('http://<bu-server-ip>:4000/api/categorize', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ text: musteriMetni })
});
const { labels, confidence, reasoning, similarExamples } = await r.json();
```

Operatör Next4biz'de düzeltme yapıp kaydederse, aynı yere POST atsın:
```javascript
await fetch('http://<bu-server-ip>:4000/api/feedback', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    sourceText: musteriMetni,
    aiSuggestion: aiOnerisi,
    finalLabels: operatorinOnayladigi,
    wasCorrected: aiOnerisi !== operatorinOnayladigi
  })
});
// Bu vaka vector store'a eklenir, sonraki tahminler kullanır.
```

## Monitoring

```powershell
pm2 list                                # Süreç durumu
pm2 logs enroute-rag                    # Canlı log
pm2 monit                                # CPU/RAM
curl http://localhost:4000/api/health   # Health check
```

## Sorun giderme

| Hata | Çözüm |
|---|---|
| MSSQL bağlanamıyor | `.env`'de `TICKET_MSSQL_*` değerlerini kontrol et |
| Embedding hatası | `GEMINI_API_KEY` set mi? Network çıkış izni var mı? |
| Vector store boş | `node scripts/bootstrap-embeddings.mjs` çalıştır |
| Port 4000 dolu | `.env`'de `PORT=4001` yap, pm2 restart |
EOF

echo "✓ README-DEPLOY.md"

echo ""
echo "=== 6. Zip paketi oluştur ==="
cd /tmp
rm -f "$OUT"
( cd "$STAGE/.." && zip -r "$OUT" "$(basename $STAGE)" -x "*.DS_Store" > /dev/null )
echo ""
echo "════════════════════════════════════════════════════════"
echo "✓ DEPLOY PAKETİ HAZIR"
echo "  Dosya: $OUT"
echo "  Boyut: $(du -h "$OUT" | cut -f1)"
echo "════════════════════════════════════════════════════════"
ls -lh "$OUT"
