# Production Deployment — Hetzner CX22 (Ubuntu 24.04)

## Önkoşul

| | |
|---|---|
| Hetzner hesabı | [console.hetzner.cloud](https://console.hetzner.cloud) |
| SSH key | Hetzner Console → Security → SSH Keys |
| Anthropic API key | [console.anthropic.com](https://console.anthropic.com) — Tier 1+ |
| Git repo URL | bu projenin GitHub/GitLab adresi (SSH veya HTTPS) |

## 1. Sunucuyu aç (5 dk)

[Hetzner Console](https://console.hetzner.cloud) → Add Server:

| Alan | Değer |
|---|---|
| Lokasyon | **Frankfurt** veya **Helsinki** (TR'ye yakın) |
| OS | **Ubuntu 24.04** |
| Type | **CX22** (Shared vCPU, 2 vCPU, 4 GB RAM, 40 GB SSD) — €4.90/ay |
| Network | IPv4 + IPv6 |
| SSH key | senin key'in |
| Name | `enroute-kb` |

Sunucu açıldıktan sonra **IP'yi not al** (örn. `159.69.45.123`).

## 2. Setup script'ini çalıştır (15 dk)

SSH ile bağlan:

```bash
ssh root@<SERVER_IP>
```

Script'i indirip çalıştır:

```bash
# Repo public'se (HTTPS):
export REPO_URL=https://github.com/<OWNER>/<REPO>.git
export SERVER_IP=<SERVER_IP>

# Repo private'sa (SSH deploy key gerekli):
# 1. Sunucuda: ssh-keygen -t ed25519 -N "" -f /root/.ssh/id_ed25519
# 2. Çıkan public key'i (cat /root/.ssh/id_ed25519.pub) repo'ya deploy key olarak ekle (read-only)
# 3. export REPO_URL=git@github.com:<OWNER>/<REPO>.git

curl -fsSL https://raw.githubusercontent.com/<OWNER>/<REPO>/main/scripts/deploy/setup-server.sh -o setup.sh
bash setup.sh "$REPO_URL" "$SERVER_IP"
```

Script:
- Sistem paketleri (nginx, certbot, ufw, fail2ban)
- Node.js 22
- `deploy` user
- Firewall (sadece 22, 80, 443)
- Repo clone → `/opt/ticket-analiz`
- `.env` şablonu (rastgele secret'larla)
- `npm install --legacy-peer-deps` + `npm run build`
- systemd service (auto-restart)
- nginx reverse proxy + Let's Encrypt SSL (nip.io domain'i)
- Backup cron (günlük 03:00, 30 gün retention)

15 dakika içinde **https://<IP-tireli>.nip.io** üzerinden çalışır olacak.

## 3. .env'i tamamla (5 dk)

Setup script `.env`'i otomatik oluşturur ama bazı değerleri **manuel girmeniz** gerek:

```bash
ssh root@<SERVER_IP>
nano /opt/ticket-analiz/.env

# Doldur:
ANTHROPIC_API_KEY=sk-ant-api03-...  # Anthropic console'dan
API_KEYS=sk-varuna-<RASTGELE_TOKEN>:varuna  # Varuna'ya verilecek (otomatik üretilmiş, bunu kullanın)

# Kaydet (Ctrl+O, Enter, Ctrl+X)

# Service'i yeniden başlat
systemctl restart ticket-analiz
journalctl -u ticket-analiz -f  # log'u izle
```

**`API_KEYS`** zaten setup script tarafından rastgele bir secret ile üretilmiş — onu kullanın. Format: `<key>:<tenant_id>`.

## 4. Super-admin oluştur (2 dk)

Admin UI'a girebilmek için:

```bash
cd /opt/ticket-analiz
sudo -u deploy npx tsx scripts/init-super-admin.ts
# email + ad + parola sorar
```

## 5. Test et

```bash
# Health (auth'suz, public)
curl https://<IP-tireli>.nip.io/api/v1/health
# → {"ok":true,"version":"v1","kb":{...}}

# Bearer auth ile RAG test
VARUNA_KEY="sk-varuna-..."  # .env'den
curl -X POST https://<IP-tireli>.nip.io/api/v1/kb/ask \
  -H "Authorization: Bearer ${VARUNA_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"query":"e-fatura gönderim hatası","topK":5}'
```

## 6. Doküman yükle

İki yol:

### A) Admin UI üzerinden
1. Browser: `https://<IP-tireli>.nip.io/login`
2. Süper admin ile giriş yap
3. Sidebar → **Bilgi Bankası** → PDF/DOCX yükle
4. **Bekleyen Embedding Üret** butonuna bas (~10-30 dk)

### B) CLI üzerinden (büyük yığınlar için)
```bash
# Sunucuya dosyaları SCP ile gönder
scp ~/Downloads/PDF/*.pdf deploy@<SERVER_IP>:/opt/ticket-analiz/data/kb/pdfs/varuna/
scp ~/Downloads/PDF/*.docx deploy@<SERVER_IP>:/opt/ticket-analiz/data/kb/docs/varuna/

# Sunucuda
ssh deploy@<SERVER_IP>
cd /opt/ticket-analiz
npx tsx scripts/ingest-kb.ts --pdfs --docs --max-embed 10000
```

## 7. Varuna entegrasyonu

Varuna BFF tarafına bu env vars ekleyin:

```bash
TICKET_KB_API_BASE=https://<IP-tireli>.nip.io
TICKET_KB_API_KEY=sk-varuna-<...>
```

API çağrı örneği (Express route'tan):

```javascript
async function askKB(query) {
  const resp = await fetch(`${process.env.TICKET_KB_API_BASE}/api/v1/kb/ask`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.TICKET_KB_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, topK: 8, rerank: true, verify: true }),
  });
  return resp.json();
}
```

## Operasyon

### Logları izle
```bash
journalctl -u ticket-analiz -f               # canlı
journalctl -u ticket-analiz --since "1 hour ago"  # son 1 saat
```

### Service restart
```bash
systemctl restart ticket-analiz
systemctl status ticket-analiz
```

### Yeni kod deploy
```bash
cd /opt/ticket-analiz
sudo -u deploy git pull
sudo -u deploy npm install --legacy-peer-deps
sudo -u deploy npm run build
systemctl restart ticket-analiz
```

### Backup geri yükleme
```bash
ls /opt/backups/                              # mevcut backup'ları gör
systemctl stop ticket-analiz
gunzip -k /opt/backups/embeddings-20260520-030000.sqlite.gz
mv /opt/ticket-analiz/data/embeddings.sqlite /opt/ticket-analiz/data/embeddings.sqlite.bak
mv /opt/backups/embeddings-20260520-030000.sqlite /opt/ticket-analiz/data/embeddings.sqlite
chown deploy:deploy /opt/ticket-analiz/data/embeddings.sqlite
systemctl start ticket-analiz
```

### Disk kullanımı
```bash
du -sh /opt/ticket-analiz/data/        # KB + embeddings DB
du -sh /opt/backups/                   # backup'lar
df -h                                  # disk genel
```

## Sorun giderme

| Belirti | Çözüm |
|---|---|
| `502 Bad Gateway` | Service durmuş: `systemctl restart ticket-analiz` + log'a bak |
| `SSL handshake error` | Sertifika expired: `certbot renew --force-renewal` |
| `Authorization header eksik` | Bearer token gönderilmedi veya yanlış format |
| `Invalid API key` | `.env`'deki API_KEYS ile request key'i eşleşmiyor |
| `embedding model yükleniyor uzun sürüyor` | İlk request'te transformers.js modeli indirir (~300 MB) |
| `429 Too Many Requests` | Rate limit aşıldı, bekle veya `API_RATE_LIMIT_PER_MIN`'i artır |
| `Claude 401/403` | ANTHROPIC_API_KEY yanlış veya billing problemi |

## Maliyet özeti

| Kalem | Aylık |
|---|---|
| Hetzner CX22 | €4.90 (~₺200) |
| Anthropic Claude (50 ticket/gün) | ~₺1350 |
| **TOPLAM** | **~₺1550** (~$45) |
