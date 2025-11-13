# Use Node 20 LTS on Alpine for minimal footprint
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better cache
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build step if needed (skip if no build phase)
# RUN npm run build

# Final image
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy dependencies
COPY --from=builder /app/node_modules ./node_modules
# Copy app
COPY --from=builder /app ./

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

ENV NODE_ENV=production
EXPOSE 10000 10443

CMD ["node", "index.js"]
