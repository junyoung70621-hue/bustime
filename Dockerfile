# ── 빌드 ──
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# NEXT_PUBLIC_* 는 빌드 시점에 클라이언트 코드에 박히므로 빌드 인자로 받음
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build && npm prune --omit=dev

# ── 운영 실행 ──
FROM node:22-alpine
RUN apk add --no-cache tzdata
ENV NODE_ENV=production \
    TZ=Asia/Seoul \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=build /app/package.json /app/next.config.mjs ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
