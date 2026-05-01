FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=development

# Install dependencies
COPY package*.json ./
# Use npm install since there's no package-lock.json in the repo
RUN npm install --no-audit --no-fund

# Copy app sources
COPY . .

# Build (if build fails, continue to allow dev server)
RUN set -eux; \
    npm run build || true

EXPOSE 3000

CMD ["npm", "run", "dev"]
