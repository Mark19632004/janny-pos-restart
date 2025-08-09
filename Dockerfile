# ============ Stage 1: Build Frontend ============
FROM node:18-slim AS fe
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm i
COPY frontend ./
RUN npm run build

# ============ Stage 2: Install Backend deps ============
FROM node:18-slim AS be_deps
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
# Keep dev deps (prisma) so we can run migrate deploy at start
RUN npm i

# ============ Stage 3: Final Runtime ============
FROM node:18-slim
ENV NODE_ENV=production
WORKDIR /app/backend

# Copy backend app
COPY --from=be_deps /app/backend/node_modules ./node_modules
COPY backend ./

# Copy frontend build into backend/dist
COPY --from=fe /app/frontend/dist ./dist

# Prisma needs OpenSSL; node:18-slim has it. Generate client now that schema is present.
RUN npx prisma generate

# Expose port (Railway sets PORT)
ENV PORT=4000
ENV FRONTEND_DIR=./dist
CMD ["node", "src/server.js"]
