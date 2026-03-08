FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Railway injects PORT; default to 80 for docker-compose
ENV PORT=80
EXPOSE $PORT
CMD sh -c "npx vite preview --port ${PORT:-3000} --host 0.0.0.0"
