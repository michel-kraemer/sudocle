FROM node:15 as build

COPY . /sudocle
WORKDIR /sudocle
RUN npm ci
RUN npm run build

FROM nginx:1.19

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /sudocle/out /usr/share/nginx/html/sudocle

EXPOSE 80
