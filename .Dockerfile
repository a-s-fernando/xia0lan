# Dockerfile

FROM node:18.16.0-alpine3.17

RUN mkdir -p /opt/app
WORKDIR /opt/app

COPY commands/ ./commands
COPY rota/ ./rota
COPY package.json package-lock.json deploy-commands.js index.js ./

CMD [ "npm", "start" ]