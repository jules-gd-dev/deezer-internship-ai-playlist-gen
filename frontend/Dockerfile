FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (ignoring scripts/optional deps if any)
RUN npm ci

# Copy the rest of the application
COPY . .

# Set env to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

EXPOSE 3000

ENV PORT=3000

# Start the Next.js server
CMD ["npm", "run", "start"]
