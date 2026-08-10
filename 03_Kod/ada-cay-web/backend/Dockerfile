FROM node:20-alpine
WORKDIR /app
COPY . .
RUN chmod +x node_modules/.bin/tsc 2>/dev/null || true
RUN node_modules/.bin/tsc || npx tsx src/server.ts
COPY db/init.sql dist/init.sql
EXPOSE 3001
CMD ["node", "dist/server.js"]