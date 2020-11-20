FROM node:15.2.1-alpine3.10

RUN mkdir -p /usr/definer/liquidator-bot

WORKDIR /usr/definer/liquidator-bot

COPY ./.env* ./
COPY ./package.json ./package-lock.json ./tsconfig.json ./
RUN npm ci

COPY ./src ./src
COPY ./abi ./abi
COPY ./network ./network
RUN npm run build

CMD ["npm", "start"]
