# Stage 1: Build
FROM oven/bun:1 AS builder

WORKDIR /app

# Install dependencies (layer cache)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build-time args for Astro SSG — not persisted in final image
ARG STRAPI_URL
ARG STRAPI_TOKEN

# Copy source and build
COPY . .
RUN bun run build

# Stage 2: Serve
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
