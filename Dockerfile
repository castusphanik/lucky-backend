# Simple Dockerfile with PM2 (Node v24)
FROM node:24-bullseye-slim

# Set working directory
WORKDIR /app

# Install dependencies needed for Prisma
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

# Install pm2 globally
RUN npm install -g pm2

# Copy package.json + lock first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate
# RUN npm start

# Copy application source
COPY . .

# Expose app port
EXPOSE 9330

# Start app with PM2
CMD ["pm2-runtime", "./dist/bin/www.js"]
