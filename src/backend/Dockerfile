# Stage 1: Base
FROM node:20-alpine AS base
WORKDIR /usr/src/app

# Stage 2: Dependencies
FROM base AS dependencies
COPY package*.json ./
RUN npm ci

# Stage 3: Development
FROM dependencies AS development
COPY . .
CMD ["npm", "run", "start:dev"]

# Stage 4: Build
FROM dependencies AS build
COPY . .
RUN npm run build
# Prune dev dependencies
RUN npm ci --only=production && npm cache clean --force

# Stage 5: Production
FROM base AS production
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
CMD ["node", "dist/main"]
