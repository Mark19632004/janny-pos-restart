# Use multi-stage to build and serve the Janny POS (frontend and backend)
# Install dependencies and build in the first stage
FROM node:18-slim AS build
WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate the Prisma client based on schema.prisma

# Copy installed dependencies and built assets from the build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/schema.prisma ./schema.prisma
# Copy Prisma migrations and client (if present)
COPY --from=build /app/prisma ./prisma

# Expose the port the app runs on
EXPOSE 4000

# Start the server and run Prisma migrations at runtime
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./schema.prisma && node server.js"]
