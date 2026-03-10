FROM node:25-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# Build
FROM node:25-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Run production
FROM node:25-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app ./

EXPOSE 3000

CMD ["npm", "start"]
