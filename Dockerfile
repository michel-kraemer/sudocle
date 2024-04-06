FROM node:20-slim as build

RUN mkdir /sudocle
COPY package.json /sudocle
COPY package-lock.json /sudocle
WORKDIR /sudocle
RUN npm ci

ARG MATOMO_URL
ARG MATOMO_SITE_ID
ARG SUDOCLE_CORS_ALLOW_ORIGIN

COPY . /sudocle
RUN npm run build

FROM node:20-slim

RUN useradd -s /bin/bash -m sudocle && \
    mkdir -p /sudocle/.next/cache/fetch-cache && \
    chown -R sudocle /sudocle/.next/cache/fetch-cache

COPY --from=build /sudocle/.next/standalone/ /sudocle
WORKDIR /sudocle

EXPOSE 3000

USER sudocle
CMD ["node", "server.js"]
