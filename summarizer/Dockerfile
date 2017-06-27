FROM node:8.1.2-alpine

MAINTAINER Andy Puch

COPY . /opt/
WORKDIR /opt

RUN npm install pm2 -g
RUN npm install

CMD pm2 start --no-daemon production.json
