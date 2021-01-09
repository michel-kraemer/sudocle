FROM nginx:1.19

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY out /usr/share/nginx/html/sudocle

EXPOSE 80
