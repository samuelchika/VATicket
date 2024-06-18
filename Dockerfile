FROM node:lts-bookworm-slim

#USER node

# make node have the permission to dependencies in node_modules 
RUN mkdir -p /app/node_modules && chown -R node:node /app

RUN chown -R node:node /app/*

WORKDIR /app

COPY ./package*.json ./


RUN npm install 

COPY --chown=node:node . .

USER node

ENV NODE_ENV='production'

EXPOSE 3000

CMD ["node", "app.js"]
