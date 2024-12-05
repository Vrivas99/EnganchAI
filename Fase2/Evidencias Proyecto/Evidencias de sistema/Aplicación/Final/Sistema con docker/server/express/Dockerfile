FROM node:20

WORKDIR /server/express

COPY package*.json ./

RUN npm install && npm install -g nodemon

COPY . .

EXPOSE 5000

CMD ["npm","start"]
