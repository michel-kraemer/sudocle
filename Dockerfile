FROM node:16-slim as build

ARG MATOMO_URL
ARG MATOMO_SITE_ID

RUN useradd -s /bin/bash -m sudocle
RUN mkdir /sudocle
COPY package.json /sudocle
COPY package-lock.json /sudocle
WORKDIR /sudocle
RUN npm ci

COPY . /sudocle
RUN npm run build

EXPOSE 3000

USER sudocle
CMD ["npm", "run", "start"]
