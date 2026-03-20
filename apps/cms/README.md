# Inaka Coffee CMS

Strapi 5 headless CMS powering the Inaka Coffee landing page. Uses SQLite for simple, file-based storage.

---

## Commands

```bash
# Development (with auto-reload)
bun run develop

# Build admin panel
bun run build

# Production start
bun run start

# Seed Inaka Coffee data (sets permissions + populates all content types)
bun run seed:inaka
```

---

## Content Types

Five content types serve the landing page:

| Content Type | Kind | Description |
|-------------|------|-------------|
| `hero` | Single Type | Landing page headline and background image |
| `menu-category` | Collection | Menu categories (Kopi, Non-Kopi, Makanan) |
| `menu-item` | Collection | Menu items with price, image, and category |
| `wedding-info` | Single Type | Wedding venue info, facilities, gallery |
| `business-info` | Single Type | WhatsApp number, operating hours, map |

See [docs/strapi-schema-guide.md](../../docs/strapi-schema-guide.md) for full field reference.

---

## Environment Variables

Create `apps/cms/.env`:

```env
HOST=0.0.0.0
PORT=1337
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=your-salt
ADMIN_JWT_SECRET=your-secret
JWT_SECRET=your-secret
TRANSFER_TOKEN_SALT=your-salt
```

---

## Seeding

The seed script bootstraps all content in one command:

```bash
bun run seed:inaka
```

This will:
1. Set public `find`/`findOne` permissions for all 5 content types
2. Upload images from `data/uploads/`
3. Create hero, menu categories, menu items, wedding info, and business info

The seed runs only once — it checks a `inakaSeedHasRun` flag in the database. To re-seed, clear the database first (delete `.tmp/data.db`).

---

## Production Deployment

See [docs/deployment.md](../../docs/deployment.md) for full Ubuntu 24.04 VM setup with Nginx and systemd.
