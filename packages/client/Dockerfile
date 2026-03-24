FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/client/package.json packages/client/

RUN npm install --workspace=packages/shared --workspace=packages/client

COPY packages/shared/ packages/shared/
COPY packages/client/ packages/client/

EXPOSE 5173

CMD ["npm", "run", "dev", "--workspace=packages/client", "--", "--host"]
