#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# EnRoute KB — Hetzner CX22 (Ubuntu 24.04) one-shot setup.
#
# Kullanım:
#   1. Hetzner Cloud Console → Add Server → CX22 → Ubuntu 24.04 → SSH key
#   2. Sunucuya SSH:  ssh root@<SERVER_IP>
#   3. Bu scripti çalıştır:
#        curl -fsSL https://raw.githubusercontent.com/<OWNER>/<REPO>/main/scripts/deploy/setup-server.sh \
#          | bash -s -- <git-url> <server-ip>
#      veya manuel:
#        export REPO_URL=git@github.com:owner/repo.git
#        export SERVER_IP=1.2.3.4
#        bash setup-server.sh
#
# Script idempotent — yeniden çalıştırılabilir, atlanması gereken adımları atlar.
# ─────────────────────────────────────────────────────────────────────────

set -euo pipefail

REPO_URL="${REPO_URL:-${1:-}}"
SERVER_IP="${SERVER_IP:-${2:-}}"
APP_DIR="/opt/ticket-analiz"
SERVICE_NAME="ticket-analiz"
NODE_VERSION="22"
DEPLOY_USER="deploy"

if [[ -z "$REPO_URL" ]]; then
  echo "Hata: REPO_URL gerekli. Kullanım: $0 <git-url> <server-ip>" >&2
  exit 1
fi
if [[ -z "$SERVER_IP" ]]; then
  echo "Hata: SERVER_IP gerekli." >&2
  exit 1
fi

# nip.io ile IP'yi domain'e çevir (Let's Encrypt için)
DOMAIN="${SERVER_IP//./-}.nip.io"
echo "──────────────────────────────────────────────────"
echo "Setup başlıyor"
echo "  Repo:    $REPO_URL"
echo "  IP:      $SERVER_IP"
echo "  Domain:  $DOMAIN (nip.io)"
echo "  App:     $APP_DIR"
echo "──────────────────────────────────────────────────"

# ─── 1. Sistem paketleri ──────────────────────────────────────────────────
echo "[1/10] Sistem paketleri..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq \
  curl ca-certificates gnupg git build-essential \
  nginx certbot python3-certbot-nginx \
  ufw fail2ban unattended-upgrades

# ─── 2. Node.js 22 ─────────────────────────────────────────────────────────
echo "[2/10] Node.js ${NODE_VERSION}..."
if ! command -v node >/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt "${NODE_VERSION}" ]]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash -
  apt-get install -y -qq nodejs
fi
node -v
npm -v

# ─── 3. Deploy user ────────────────────────────────────────────────────────
echo "[3/10] Deploy user..."
if ! id -u "$DEPLOY_USER" >/dev/null 2>&1; then
  useradd -m -s /bin/bash "$DEPLOY_USER"
  usermod -aG sudo "$DEPLOY_USER"
fi
mkdir -p /home/$DEPLOY_USER/.ssh
cp -n /root/.ssh/authorized_keys /home/$DEPLOY_USER/.ssh/ 2>/dev/null || true
chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
chmod 700 /home/$DEPLOY_USER/.ssh

# ─── 4. Firewall ───────────────────────────────────────────────────────────
echo "[4/10] Firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw status

# ─── 5. Repo clone ────────────────────────────────────────────────────────
echo "[5/10] Repo clone..."
mkdir -p "$APP_DIR"
chown $DEPLOY_USER:$DEPLOY_USER "$APP_DIR"
if [[ ! -d "$APP_DIR/.git" ]]; then
  sudo -u $DEPLOY_USER git clone "$REPO_URL" "$APP_DIR"
else
  echo "  → repo zaten var, atlanıyor"
fi

# ─── 6. .env oluştur ──────────────────────────────────────────────────────
echo "[6/10] .env şablonu..."
if [[ ! -f "$APP_DIR/.env" ]]; then
  cat > "$APP_DIR/.env" <<EOF
# ── ZORUNLU — manuel doldur ──
ANTHROPIC_API_KEY=sk-ant-api03-...
CC_SESSION_SECRET=$(openssl rand -hex 32)
# Bearer token'lar (key:tenant formatı)
API_KEYS=sk-varuna-$(openssl rand -hex 16):varuna

# ── İsteğe bağlı ──
CC_SESSION_COOKIE_NAME=cc_session
CC_SESSION_TTL_SECONDS=604800
CORS_ALLOWED_ORIGINS=*
API_RATE_LIMIT_PER_MIN=120

# ── MSSQL — Varuna kullanmıyor ama yoksa hata verir. Dummy değer OK ──
TICKET_MSSQL_SERVER=127.0.0.1
TICKET_MSSQL_DATABASE=dummy
TICKET_MSSQL_USER=dummy
TICKET_MSSQL_PASSWORD=dummy

# ── Embedding (lokal) ──
LOCAL_EMBEDDING_MODEL=Xenova/multilingual-e5-base
LOCAL_EMBEDDING_DIM=768

# ── Claude modelleri ──
ANTHROPIC_PRIMARY_MODEL=claude-sonnet-4-5
ANTHROPIC_FAST_MODEL=claude-haiku-4-5
ANTHROPIC_MAX_RETRIES=2
EOF
  chown $DEPLOY_USER:$DEPLOY_USER "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
  echo "  → .env oluşturuldu. ANTHROPIC_API_KEY ve API_KEYS'i düzenleyin!"
fi

# ─── 7. npm install + build ───────────────────────────────────────────────
echo "[7/10] npm install + build..."
cd "$APP_DIR"
sudo -u $DEPLOY_USER npm install --legacy-peer-deps
sudo -u $DEPLOY_USER npm run build || {
  echo "Build başarısız. .env eksiksiz mi? Sonra: cd $APP_DIR && npm run build"
}

# ─── 8. systemd service ────────────────────────────────────────────────────
echo "[8/10] systemd service..."
cat > /etc/systemd/system/${SERVICE_NAME}.service <<EOF
[Unit]
Description=EnRoute KB Service (Next.js)
After=network.target

[Service]
Type=simple
User=$DEPLOY_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$APP_DIR/.env
ExecStart=/usr/bin/node node_modules/.bin/next start -p 3000
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl restart $SERVICE_NAME
sleep 3
systemctl status $SERVICE_NAME --no-pager || true

# ─── 9. nginx + SSL ────────────────────────────────────────────────────────
echo "[9/10] nginx + SSL ($DOMAIN)..."
cat > /etc/nginx/sites-available/$SERVICE_NAME <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 60M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
    }
}
EOF
ln -sf /etc/nginx/sites-available/$SERVICE_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# Let's Encrypt SSL — nip.io ile çalışır
echo "  → Let's Encrypt sertifika alınıyor..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos \
  --email "admin@$DOMAIN" --redirect || {
  echo "  ⚠ SSL alınamadı. Manuel deneyin: certbot --nginx -d $DOMAIN"
}

# ─── 10. Backup cron ──────────────────────────────────────────────────────
echo "[10/10] Backup cron..."
mkdir -p /opt/backups
cat > /opt/backup-kb.sh <<EOF
#!/usr/bin/env bash
# Günlük sqlite snapshot. 30 günden eski olanları temizle.
set -e
DEST="/opt/backups/embeddings-\$(date +%Y%m%d-%H%M%S).sqlite"
sqlite3 $APP_DIR/data/embeddings.sqlite ".backup '\$DEST'"
gzip "\$DEST"
find /opt/backups -name "embeddings-*.sqlite.gz" -mtime +30 -delete
echo "Backup OK: \$DEST.gz"
EOF
chmod +x /opt/backup-kb.sh

# sqlite3 cli yoksa kur
apt-get install -y -qq sqlite3

# Cron — her gece 03:00
(crontab -l 2>/dev/null | grep -v "backup-kb.sh"; echo "0 3 * * * /opt/backup-kb.sh >> /var/log/kb-backup.log 2>&1") | crontab -

# ─── Final ────────────────────────────────────────────────────────────────
cat <<EOF

╔════════════════════════════════════════════════════════════════════╗
║  SETUP TAMAMLANDI                                                  ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Service URL:    https://$DOMAIN                                   ║
║  Health check:   curl https://$DOMAIN/api/v1/health                ║
║                                                                    ║
║  Log izle:       journalctl -u $SERVICE_NAME -f                    ║
║  Service durum:  systemctl status $SERVICE_NAME                    ║
║  Restart:        systemctl restart $SERVICE_NAME                   ║
║                                                                    ║
║  ── BAŞLAMADAN ÖNCE ──                                            ║
║  1. .env'i düzenle:  nano $APP_DIR/.env                            ║
║     - ANTHROPIC_API_KEY  → gerçek key                              ║
║     - API_KEYS           → Varuna'ya verilecek token               ║
║  2. systemctl restart $SERVICE_NAME                                ║
║  3. Super-admin oluştur:                                           ║
║     cd $APP_DIR && sudo -u $DEPLOY_USER npx tsx scripts/init-super-admin.ts ║
║                                                                    ║
║  ── BACKUP ──                                                     ║
║  Günlük 03:00'te /opt/backups/ altına alınır (30 gün retention)    ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
EOF
