# Strapi CMS Setup Guide — Inaka Coffee

## Prerequisites

- Strapi 5.x running at `http://localhost:1337`
- Admin account created

---

## 1. API Token Setup

1. Go to **Settings → API Tokens → Create new API token**
2. Name: `landing-readonly`
3. Token type: **Read-only**
4. Copy the token and paste it into `apps/landing/.env`:
   ```
   STRAPI_TOKEN=your-token-here
   ```

---

## 2. Content Type Permissions

For each content type below, go to **Settings → Roles → Public** and enable `find`/`findOne`:

- hero
- menu-category
- menu-item
- wedding-info
- business-info

---

## 3. Content Types Reference

The following content types are created via code in `apps/cms/src/api/`. Strapi will auto-detect them on startup.

### Hero (Single Type)
| Field | Type | Notes |
|-------|------|-------|
| headline | String | Required. Main landing page headline. |
| subheadline | Text | Subtitle shown below headline. |
| backgroundImage | Media (image) | Hero background photo. |

**Seed data:**
- headline: `A trip for coffee won't hurt your feet`
- subheadline: `Nikmati kopi berkualitas tinggi di tengah suasana alam yang tenang.`

---

### Menu Category (Collection Type)
| Field | Type | Notes |
|-------|------|-------|
| name | String | Required. E.g. "Kopi", "Non-Kopi", "Makanan" |
| slug | UID | Auto-generated from name |
| order | Integer | Display order (ascending) |

**Seed data:** Kopi (1), Non-Kopi (2), Makanan (3)

---

### Menu Item (Collection Type, Draft & Publish)
| Field | Type | Notes |
|-------|------|-------|
| name | String | Required. Item name. |
| price | Integer | Required. Price in IDR (e.g. 25000). |
| description | Text | Short description. |
| image | Media (image) | Product photo. |
| category | Relation (→ Menu Category) | manyToOne |

**Important:** Publish items to make them visible on the landing page.

---

### Wedding Info (Single Type)
| Field | Type | Notes |
|-------|------|-------|
| title | String | Section heading. |
| description | Rich Text | Detailed description. |
| capacity | Integer | Max guest capacity. |
| facilities | Component (wedding.facility, repeatable) | List of venue facilities. |
| pricelistPdf | Media (file) | PDF download for pricing. |
| galleryImages | Media (images, multiple) | Gallery photos. |

**Facility component fields:** `name` (string, required), `icon` (string)

---

### Business Info (Single Type)
| Field | Type | Notes |
|-------|------|-------|
| whatsappNumber | String | E.g. `6281234567890` (no +) |
| whatsappMessage | Text | Default WhatsApp message. |
| mapCoordinates | String | Lat,Lng e.g. `-6.2,106.8` |
| mapEmbedUrl | Text | Google Maps embed iframe URL |
| ramadanHours | JSON | `{"weekday": "16:00-22:00", "weekend": "14:00-22:00"}` |
| normalHours | JSON | `{"weekday": "08:00-22:00", "weekend": "08:00-23:00"}` |

---

## 4. Seeding Data

The seed script sets permissions and populates all 5 content types automatically:

```bash
cd apps/cms && bun run seed:inaka
```

This handles:
- Setting public `find`/`findOne` permissions for all content types
- Uploading images from `data/uploads/`
- Creating all sample content (hero, menu categories, menu items, wedding info, business info)

The seed runs only once per database. To re-seed, delete `.tmp/data.db` and run again.

---

## 5. Running Both Apps

```bash
# Terminal 1 — CMS
cd apps/cms && bun run develop

# After CMS is up, seed data (first time only):
bun run seed:inaka

# Terminal 2 — Landing
cd apps/landing && bun run dev
```

The landing page uses fallback data when Strapi is not running, so it works standalone.

---

## 6. Environment Variables

`apps/landing/.env`:
```
STRAPI_URL=http://localhost:1337
STRAPI_TOKEN=your-api-token-here
```

---

## 7. Production Notes

For production deployment on Ubuntu 24.04 with Nginx and systemd, see the full guide:
[docs/deployment.md](./deployment.md)

Key differences in production:
- `HOST=127.0.0.1` (bind to localhost only — Nginx proxies external traffic)
- `NODE_ENV=production` (required for Strapi)
- Run `bun run build` to compile the admin panel before starting
- Use a systemd service (`inaka-cms.service`) for process management
- SQLite DB at `apps/cms/.tmp/data.db` — set up daily cron backup
