FROM node:20

WORKDIR /usr/src/his_connect

COPY package.json ./
COPY CHANGELOG.md ./
RUN npm install
RUN npm audit fix --force
RUN npm install -g pm2 nodemon

RUN mkdir -p ./app
COPY app/. ./app

EXPOSE 3004

# CMD ["pm2-runtime", "start", "app/app.js", "-i", "2", "--name", "his-connect"]

