FROM node:20-alpine AS build
WORKDIR /app
COPY . .
RUN node_modules/.bin/tsc -b && node_modules/.bin/vite build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN chmod -R a+r /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]