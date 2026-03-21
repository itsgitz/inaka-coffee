# Production Deployment Guide — Inaka Coffee

Target: **Ubuntu 24.04 VM, SQLite, Nginx reverse proxy, Docker (landing), PM2 (CMS)**

---

## 1. Server Prerequisites

```bash
# Node.js 22+ via nodesource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Bun
curl -fsSL https://bun.sh/install | bash

# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker inaka

# Other tools
sudo apt-get install -y git nginx ufw

# Create dedicated system user
sudo useradd --system --create-home --shell /bin/bash inaka
```

---

## 2. Clone & Install

```bash
sudo mkdir -p /opt/inaka-coffee
sudo chown inaka:inaka /opt/inaka-coffee
sudo -u inaka git clone https://github.com/itsgitz/inaka-coffee.git /opt/inaka-coffee

cd /opt/inaka-coffee
sudo -u inaka bun install
sudo -u inaka bash -c "cd apps/cms && bun install"
```

---

## 3. Strapi CMS Production Setup

### Environment variables

Create `/opt/inaka-coffee/apps/cms/.env`:

```env
HOST=127.0.0.1
PORT=1337
APP_KEYS=your-app-key-1,your-app-key-2,your-app-key-3,your-app-key-4
API_TOKEN_SALT=your-api-token-salt
ADMIN_JWT_SECRET=your-admin-jwt-secret
JWT_SECRET=your-jwt-secret
TRANSFER_TOKEN_SALT=your-transfer-token-salt
NODE_ENV=production
```

Generate secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Build admin panel

```bash
sudo -u inaka bash -c "cd /opt/inaka-coffee/apps/cms && NODE_ENV=production bun run build"
```

### Seed data

```bash
sudo -u inaka bash -c "cd /opt/inaka-coffee/apps/cms && bun run seed:inaka"
```

### Database location

SQLite database: `/opt/inaka-coffee/apps/cms/.tmp/data.db`

---

## 4. Astro Landing Production Setup (Docker)

### Environment variables

Create `/opt/inaka-coffee/apps/landing/.env` (see `apps/landing/.env.example`):

```env
STRAPI_URL=http://127.0.0.1:1337
STRAPI_TOKEN=your-read-only-api-token
```

Generate the API token in Strapi admin: **Settings → API Tokens → Create new API token** (Read-only).

### Build and run with Docker Compose

```bash
cd /opt/inaka-coffee
sudo -u inaka docker compose up -d --build
```

This builds the landing page Docker image (multi-stage: Bun build → Nginx Alpine) using `STRAPI_URL` and `STRAPI_TOKEN` from `apps/landing/.env` as build-time args. The final image serves static files only — no secrets baked in.

Verify:
```bash
docker compose ps
curl http://localhost:8080
```

---

## 5. PM2 — CMS Process Manager

Install PM2:

```bash
sudo -u inaka bun install -g pm2
```

Start the CMS:

```bash
sudo -u inaka bash -c "cd /opt/inaka-coffee && pm2 start apps/cms/ecosystem.config.cjs"
```

Save process list and enable auto-start on reboot:

```bash
sudo -u inaka pm2 save
sudo env PATH=$PATH:/home/inaka/.bun/bin pm2 startup systemd -u inaka --hp /home/inaka
```

Useful PM2 commands:

```bash
pm2 status                  # Show process list
pm2 logs inaka-cms          # Tail logs
pm2 restart inaka-cms       # Restart CMS
pm2 stop inaka-cms          # Stop CMS
```

---

## 6. Nginx Configuration

Create `/etc/nginx/sites-available/inaka-coffee`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Landing page (served from Docker container)
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # CMS Admin
    location /admin {
        proxy_pass http://127.0.0.1:1337;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # CMS API
    location /api {
        proxy_pass http://127.0.0.1:1337;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # CMS Uploads
    location /uploads {
        proxy_pass http://127.0.0.1:1337;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/inaka-coffee /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. SSL (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot auto-renews. Verify with:
```bash
sudo certbot renew --dry-run
```

---

## 8. SQLite Backup

### Setup backup directory

```bash
sudo mkdir -p /opt/backups/inaka-coffee
sudo chown inaka:inaka /opt/backups/inaka-coffee
```

### Cron job (daily backup, keep 7 days)

Add to `inaka` user's crontab (`sudo -u inaka crontab -e`):

```cron
0 2 * * * cp /opt/inaka-coffee/apps/cms/.tmp/data.db /opt/backups/inaka-coffee/data-$(date +\%Y\%m\%d).db && find /opt/backups/inaka-coffee/ -name "data-*.db" -mtime +7 -delete
```

---

## 9. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 10. Updating

```bash
sudo -u inaka bash -c "cd /opt/inaka-coffee && git pull"

# Rebuild and restart landing (Docker)
sudo -u inaka docker compose up -d --build

# Rebuild CMS admin panel
sudo -u inaka bash -c "cd /opt/inaka-coffee/apps/cms && NODE_ENV=production bun run build"

# Restart CMS (PM2)
sudo -u inaka pm2 restart inaka-cms
```
