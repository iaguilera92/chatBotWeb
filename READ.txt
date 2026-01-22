INICIO DEL PROYECTO
===================

//CREAMOS CARPETAS
mkdir backend frontend

//INICIAMOS BACKEND NOTE.JS
cd backend
npm init -y


//INSTALAMOS PAQUETES
npm install fastify dotenv axios
npm install -D typescript ts-node-dev @types/node

npx tsc --init

//INSTALAMOS frontend
cd ../frontend
npm create vite@latest . -- --template react
npm install
npm run dev

//CORRER APP - Se creo package.json en la raiz (concurrently) permite ejecutar back/front
npm install
npm run dev

//BACKEND
Fastify Creador de APIs escalable con Node.js

//CORREO
pwbot.ia@gmail.com
