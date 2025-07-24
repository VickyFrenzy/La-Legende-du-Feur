ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS build-env

WORKDIR /la-legende-du-feur

COPY src src
COPY package*.json tsconfig.json ./

RUN npm install
RUN npm run build

###########

FROM node:${NODE_VERSION} AS deps-env

WORKDIR /la-legende-du-feur

ARG NODE_ENV=production

COPY package*.json tsconfig.json ./

RUN npm install --omit=dev

###########

FROM node:${NODE_VERSION} AS run-env

WORKDIR /la-legende-du-feur

RUN chown -R node:node /la-legende-du-feur

COPY --chown=node:node --from=deps-env /la-legende-du-feur/node_modules node_modules
COPY --chown=node:node --from=build-env /la-legende-du-feur/dist dist
COPY --chown=node:node package*.json tsconfig.json ./

ARG NODE_ENV=production

USER node

CMD ["node", "."]
