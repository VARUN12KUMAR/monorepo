FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Ensure TypeScript is installed
RUN npm install typescript @types/node --save-dev

# Build TypeScript files
RUN npm run build

EXPOSE 4000

# Run migrations and start the application
CMD ["sh", "-c", "echo 'Running migrations...' && npm run migrate && echo 'Migrations completed. Starting application...' && node dist/index.js"]