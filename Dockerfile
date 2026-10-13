# syntax=docker/dockerfile:1

FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# O config.js de dev (public/runtime) não vai para a imagem: em runtime ele é gerado.
RUN npm run build && rm -rf dist/runtime

FROM nginxinc/nginx-unprivileged:1.30.5-alpine3.24
USER root
RUN rm -rf /usr/share/nginx/html/*
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --chmod=0755 nginx/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
COPY --from=build /app/dist /usr/share/nginx/html
# Gravável pelo UID 101 quando o root FS não é read-only (docker run simples).
# No K8s, um emptyDir é montado aqui por cima.
RUN mkdir -p /usr/share/nginx/html/runtime && chown 101:101 /usr/share/nginx/html/runtime
USER 101
EXPOSE 8080
# ENTRYPOINT (/docker-entrypoint.sh) e CMD (nginx -g 'daemon off;') vêm da imagem base.
