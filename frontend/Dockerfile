# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy config files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Serve stage
FROM caddy:2-alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/caddy

# Copy Caddy configuration
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80 443
