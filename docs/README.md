# Inaka Coffee — Documentation

## Progress Tracker

| Document | Status | Description |
|----------|--------|-------------|
| `strapi-schema-guide.md` | Done | CMS content types, API tokens, permissions |
| `deployment.md` | Done | Production deployment on Ubuntu 24.04 VM |

---

## Architecture

| App | Stack | Purpose |
|-----|-------|---------|
| `apps/landing/` | Astro 6 + React + Tailwind 4 | Static landing page |
| `apps/cms/` | Strapi 5 + SQLite | Headless CMS |

---

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Start CMS and seed data
cd apps/cms && bun run develop
# In a new terminal (after CMS is running):
bun run seed:inaka

# 3. Start landing page
cd apps/landing && bun run dev
```

Landing page: `http://localhost:4321`
CMS admin: `http://localhost:1337/admin`

---

## Environment Variables

**`apps/landing/.env`**
```
STRAPI_URL=http://localhost:1337
STRAPI_TOKEN=your-api-token-here
```

**`apps/cms/.env`** (development)
```
HOST=0.0.0.0
PORT=1337
APP_KEYS=...
API_TOKEN_SALT=...
ADMIN_JWT_SECRET=...
JWT_SECRET=...
TRANSFER_TOKEN_SALT=...
```

---

## Further Reading

- [Strapi Schema Guide](./strapi-schema-guide.md) — content types reference and seeding
- [Deployment Guide](./deployment.md) — production setup on Ubuntu 24.04
