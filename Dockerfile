FROM oven/bun:1-alpine

WORKDIR /app

# Copy dependency specifications
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy application source code
COPY . .

# Build the frontend production assets
RUN bun run build

# Expose server port
EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production

# Start fullstack Brightloop SMS server
CMD ["bun", "run", "server/index.ts"]
