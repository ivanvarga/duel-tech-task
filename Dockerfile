FROM node:20-alpine

WORKDIR /app

# Install tar (required for ExtractFilesWorker)
RUN apk add --no-cache tar

# Enable Corepack for Yarn
RUN corepack enable

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
# Use --frozen-lockfile for production, but allow flexibility for development
RUN yarn install

# Copy source code
COPY . .

# Build TypeScript
RUN yarn build

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 hapi

# Create directories for data
RUN mkdir -p /app/users /app/failed-imports && \
    chown -R hapi:nodejs /app

USER hapi

EXPOSE 3000

CMD ["node", "dist/api/server.js"]
