FROM node:20-slim as build

RUN useradd -s /bin/bash -m sudocle
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

RUN mkdir -p /sudocle/.next/cache/fetch-cache && \
    chown -R sudocle /sudocle/.next/cache/fetch-cache

EXPOSE 3000

USER sudocle
CMD ["npm", "run", "start"]
