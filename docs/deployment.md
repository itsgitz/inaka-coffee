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

## 2. Environment Secrets (GitHub Actions)

`.env` files are encrypted with AES-256-GCM and committed to git as `.env.enc`. The encrypted output is **base64-encoded plain text**, so it can be copied directly into GitHub Actions Secrets. The encryption password is stored as a separate GitHub Actions Secret and used to decode them in CI/CD.

### One-time setup (local)

Encrypt both apps' `.env` files and commit them:

```bash
bun run env:encode -- --app landing
bun run env:encode -- --app cms
git add apps/landing/.env.enc apps/cms/.env.enc
git commit -m "chore: add encrypted env files"
git push
```

### GitHub Actions Secret

Go to **Settings → Secrets and variables → Actions** and add:

| Name | Value |
|------|-------|
| `ENV_ENCODER_PASSWORD` | Your chosen encryption password |

### Decode in CI workflow

Add this step before any build or deploy step that needs the env files:

```yaml
- name: Decode env files
  env:
    ENV_ENCODER_PASSWORD: ${{ secrets.ENV_ENCODER_PASSWORD }}
  run: |
    ENV_ENCODER_PASSWORD="$ENV_ENCODER_PASSWORD" bun run env:decode -- --app landing
    ENV_ENCODER_PASSWORD="$ENV_ENCODER_PASSWORD" bun run env:decode -- --app cms
```

### Decode on the server

After cloning on the production server, decode before starting services:

```bash
ENV_ENCODER_PASSWORD="your-password" bun run env:decode -- --app landing
ENV_ENCODER_PASSWORD="your-password" bun run env:decode -- --app cms
```

Or store the password in the server's environment:

```bash
export ENV_ENCODER_PASSWORD="your-password"
bun run env:decode -- --app landing
bun run env:decode -- --app cms
```

> To rotate secrets: update the `.env` files, re-run `env:encode`, commit the new `.enc` files, and update the GitHub Actions Secret with the new password.

---

## 3. Clone & Install

```bash
sudo mkdir -p /opt/inaka-coffee
sudo chown inaka:inaka /opt/inaka-coffee
sudo -u inaka git clone https://github.com/itsgitz/inaka-coffee.git /opt/inaka-coffee

cd /opt/inaka-coffee
sudo -u inaka bun install
sudo -u inaka bash -c "cd apps/cms && bun install"
```

---

## 4. Strapi CMS Production Setup

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

## 5. Astro Landing Production Setup (Docker)

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

## 6. PM2 — CMS Process Manager

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

## 7. Nginx Configuration

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

## 8. SSL (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot auto-renews. Verify with:
```bash
sudo certbot renew --dry-run
```

---

## 9. SQLite Backup

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

## 10. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 11. Updating

```bash
sudo -u inaka bash -c "cd /opt/inaka-coffee && git pull"

# Re-decode env files if .enc files changed
export ENV_ENCODER_PASSWORD="your-password"
sudo -u inaka bash -c "cd /opt/inaka-coffee && ENV_ENCODER_PASSWORD='$ENV_ENCODER_PASSWORD' bun run env:decode -- --app landing"
sudo -u inaka bash -c "cd /opt/inaka-coffee && ENV_ENCODER_PASSWORD='$ENV_ENCODER_PASSWORD' bun run env:decode -- --app cms"

# Rebuild and restart landing (Docker)
sudo -u inaka docker compose up -d --build

# Rebuild CMS admin panel
sudo -u inaka bash -c "cd /opt/inaka-coffee/apps/cms && NODE_ENV=production bun run build"

# Restart CMS (PM2)
sudo -u inaka pm2 restart inaka-cms
```
