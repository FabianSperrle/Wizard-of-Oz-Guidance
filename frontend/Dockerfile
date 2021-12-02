FROM node:buster

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app

RUN npm install

COPY . /usr/src/app

EXPOSE 4200 49153

CMD [ "npm", "run", "live:docker" ]
