FROM node:8.7.0
WORKDIR /usr/src/app
COPY package.json /usr/src/app
RUN npm install
COPY . /usr/src/app
ENV NODE_ENV docker
CMD node index.js
EXPOSE 3000