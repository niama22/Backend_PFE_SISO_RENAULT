FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
ENV CHOKIDAR_USEPOLLING=true
ENV CHOKIDAR_INTERVAL=1000
ENV WATCHPACK_POLLING=true
CMD ["npm", "run", "start:dev"]

