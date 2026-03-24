FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/

RUN npm install --workspace=packages/shared --workspace=packages/server

COPY packages/shared/ packages/shared/
COPY packages/server/ packages/server/

EXPOSE 3001

CMD ["npm", "run", "dev", "--workspace=packages/server"]
