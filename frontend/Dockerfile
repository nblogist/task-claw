# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
# No VITE_API_URL needed — nginx proxies /api/ to the backend at runtime,
# so the JS bundle uses relative paths (same origin).
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf.template

ENV PORT=3000
ENV BACKEND_URL=http://localhost:8000

# Derive host from BACKEND_URL, substitute vars, launch nginx
CMD sh -c "export BACKEND_HOST=$(echo $BACKEND_URL | sed 's|https\?://||' | sed 's|/.*||') && envsubst '\$PORT \$BACKEND_URL \$BACKEND_HOST' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
