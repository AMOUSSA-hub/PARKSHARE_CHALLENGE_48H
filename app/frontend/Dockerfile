FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Expose le port par défaut de Vite
EXPOSE 5173
# Lance le serveur de développement en autorisant les connexions externes
CMD ["npm", "run", "dev", "--", "--host"]
