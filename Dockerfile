# Stage 1: Building the code
FROM node:18-alpine AS builder

WORKDIR /yahoo-visor

RUN apk add --no-cache yarn

# Install dependencies for building
COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source and build
COPY /app ./app
COPY /public ./public
COPY tsconfig*.json ./
COPY next.config.ts ./
RUN yarn build

# Stage 2: Run the built code
FROM node:18-alpine AS runner
WORKDIR /yahoo-visor

# Set to production
ENV NODE_ENV=production

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /yahoo-visor/public ./public
COPY --from=builder /yahoo-visor/package.json ./package.json
COPY --from=builder /yahoo-visor/yarn.lock ./yarn.lock

# Copy built assets
COPY --from=builder --chown=nextjs:nodejs /yahoo-visor/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /yahoo-visor/.next/static ./.next/static

# Set user
USER nextjs

# Expose and run
EXPOSE 3075
ENV PORT 3075

CMD ["node", "server.js"]
