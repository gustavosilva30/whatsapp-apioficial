FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

ENV PORT=80

EXPOSE 80

CMD ["npx", "tsx", "server.ts"]
