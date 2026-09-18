# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy config files
COPY package.json ./

# Install dependencies (ignoring scripts to avoid esbuild issues on alpine if any)
RUN pnpm install --ignore-scripts

# Copy source code
COPY . .

# Build the app
RUN pnpm run build

# Serve stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
