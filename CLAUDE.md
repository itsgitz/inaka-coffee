
# Inaka Coffee — Project Rules

## Project Structure

This is a Bun monorepo with two apps:

- `apps/landing/` — Astro 6 + React + Tailwind 4 static landing page (port 4321)
- `apps/cms/` — Strapi 5 + SQLite headless CMS (port 1337)

See `docs/README.md` for architecture overview and quick start.

## Bun

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## Module System

Use ESM (`import`/`export`) everywhere. The root `package.json` sets `"type": "module"`.

- Use `import` instead of `require()`
- Use `export` / `export default` instead of `module.exports`
- Use `import.meta.url` instead of `__filename` / `__dirname`

**Exception:** `apps/cms/scripts/` seed scripts use CommonJS (`require`) because Strapi's bootstrap API (`createStrapi`, `compileStrapi`) does not support ESM entry points. Do not convert these scripts to ESM.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## CMS (Strapi)

- Content types live in `apps/cms/src/api/`
- Seed data: `apps/cms/data/inaka-data.json`
- Seed script: `apps/cms/scripts/seed-inaka.js` — run with `bun run seed:inaka`
- The seed sets public permissions for all 5 content types automatically
- SQLite DB: `apps/cms/.tmp/data.db` — delete to reset and re-seed
- PM2 config: `apps/cms/ecosystem.config.cjs` — production process manager

## CI/CD & Deployment

- **CI workflow**: `.github/workflows/ci-landing.yml` — triggers on push/PR to `master` for landing app changes; runs `bun install` + `astro build` with placeholder env vars
- **Docker**: `apps/landing/Dockerfile` — multi-stage build (Bun + Astro → Nginx Alpine); `STRAPI_URL` and `STRAPI_TOKEN` are build-time args only
- **Docker Compose**: `docker-compose.yml` at project root — `docker compose up -d --build`; env vars loaded from `apps/landing/.env` via `env_file`
- **PM2**: `apps/cms/ecosystem.config.cjs` — Strapi process manager for production; `pm2 start apps/cms/ecosystem.config.cjs`
- See `docs/deployment.md` for full production setup guide

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.
