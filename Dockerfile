FROM node:22-bookworm-slim

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates ffmpeg openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma

RUN npm ci
RUN npx prisma generate

COPY . .

RUN npm run build

CMD ["sh", "-c", "case \"${RAILWAY_SERVICE_NAME}:${SERVICE_ROLE}\" in *worker*) npm run worker ;; *) npm run start ;; esac"]
