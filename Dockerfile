FROM node:22-alpine

WORKDIR /usr/src/his_connect

COPY package.json ./
COPY CHANGELOG.md ./
RUN npm install && npm cache clean --force \
    && npm audit fix --force \
    && npm install -g pm2 nodemon typescript ts-node
#RUN npm install
#RUN npm audit fix --force
#RUN npm install -g pm2 nodemon typescript ts-node

RUN mkdir -p ./app
COPY app/. ./app

EXPOSE 3004

# CMD ["pm2-runtime", "start", "app/app.js", "-i", "2", "--name", "his-connect"]
# CMD ["pm2-runtime", "app/server.js"]
