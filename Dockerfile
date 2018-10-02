FROM node:8.7.0
WORKDIR /usr/src/app
COPY package.json /usr/src/app
RUN npm install
COPY . /usr/src/app
ENV NODE_ENV=docker
ARG IS_HANDLER=0
ENV IS_HANDLER=$IS_HANDLER
CMD ["npm", "start"]
EXPOSE 3000