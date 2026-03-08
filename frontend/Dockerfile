FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build
EXPOSE 80
CMD ["npx", "vite", "preview", "--port", "80", "--host", "0.0.0.0"]
