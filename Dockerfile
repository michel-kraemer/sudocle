FROM node:16 as build

ARG MATOMO_URL
ARG MATOMO_SITE_ID

RUN mkdir /sudocle
COPY package.json /sudocle
COPY package-lock.json /sudocle
WORKDIR /sudocle
RUN npm ci

COPY . /sudocle
RUN npm run build

FROM nginx:1.19

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /sudocle/out /usr/share/nginx/html/sudocle

EXPOSE 80
