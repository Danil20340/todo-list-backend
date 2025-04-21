FROM node:19.5.0-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Выполняем миграции и сиды уже после старта, чтобы база точно была доступна
CMD ["sh", "-c", "npx knex migrate:latest && npx knex seed:run && npm start"]
