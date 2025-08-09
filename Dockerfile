# Stage 1: Install dependencies and build the frontend
FROM node:18-slim AS build
WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install
# Install backend dependencies not included in package.json
RUN npm install express cors pdfkit uuid dayjs dotenv @prisma/client prisma

# Copy the rest of the application code
COPY . .

# Build the frontend (creates a dist folder)
RUN npm run build

# Stage 2: runtime image
FROM node:18-slim AS runtime
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev
# Install backend dependencies again to ensure they are present
RUN npm install express cors pdfkit uuid dayjs dotenv @prisma/client prisma

# Copy built assets and server code from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/schema.prisma ./schema.prisma
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules ./node_modules

# Expose the port the app runs on
EXPOSE 4000

# Run Prisma client generation and migrations, then start the server
CMD ["sh", "-c", "npx prisma generate --schema=./schema.prisma && npx prisma migrate deploy --schema=./schema.prisma && node server.js"]
