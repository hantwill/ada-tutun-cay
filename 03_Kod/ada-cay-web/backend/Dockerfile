FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
COPY db/init.sql dist/init.sql
EXPOSE 3001
CMD ["node", "dist/server.js"]