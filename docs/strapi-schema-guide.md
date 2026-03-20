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

## 4. Running Both Apps

```bash
# Terminal 1 — CMS
cd apps/cms && bun run develop

# Terminal 2 — Landing
cd apps/landing && bun run dev
```

The landing page uses fallback data when Strapi is not running, so it works standalone.

---

## 5. Environment Variables

`apps/landing/.env`:
```
STRAPI_URL=http://localhost:1337
STRAPI_TOKEN=your-api-token-here
```
