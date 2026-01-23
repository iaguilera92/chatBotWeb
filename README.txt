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
//SMTP SERVIDOR


ESTRUCTURA:
Estoy desarrollando un chatbot con OpenAI usando REACT Node.js, tengo dos capas (backend/frontend),
tengo interfaz para simular un chat con wsp, en backend/src tengo mis prompts, routes y services, en la raiz el .env, uso Fastify.
En el frontend tengo public, src esta App.jsx (tengo carpeta components, config,pages, services). 
Mi hosting es Render ya tengo publicado API y FRONT. Habla resumido y con energia.