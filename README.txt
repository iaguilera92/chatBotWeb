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

//CORRER APP - Se creo package.json en la raiz (concurrently) permite ejecutar back/front
npm install
npm run dev

//BACKEND
Fastify Creador de APIs escalable con Node.js

//CORREO - SMTP SERVIDOR
pwbot.ia@gmail.com

//SIMULAR HOSTING RENDER
npm ci
npm run build

//PROBAR BOT DE API (RENDER)
curl -X POST https://pwbot-zfzs.onrender.com/webhook/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+56900000000&Body=hola"


INSTRUCCIONES CLIENTE:
- Respaldar chats:
    - iPhone → iCloud activo + Copia de seguridad
    - Android → Google Drive activo + Copia de seguridad

- Migración:
    - Tu número de WhatsApp Business se usará en Cloud API (Configuración para producción)

- Costos mensuales:
    - OpenAI USD 10 · WhatsApp Cloud API USD 10

- PWBot IA + Panel Humano:
  - $29.990 CLP (mensual)

N° BOT: 56946873014

ESTRUCTURA:
Estoy desarrollando un chatbot con OpenAI usando REACT Node.js, tengo dos capas (backend/frontend),
tengo interfaz para simular un chat con wsp, en backend/src tengo mis prompts, routes y services, en la raiz el .env, uso Fastify.
En el frontend tengo public, src esta App.jsx (tengo carpeta components, config,pages, services). 
Mi hosting es Render ya tengo publicado API y FRONT. Estoy usando WhatsApp Cloud API (Meta) para mi N° fono.
Uso Redis en mi Render para guardar las conversaciones, tengo un panel humano, historial de conversaciones e iniciar conversacion.
Habla resumido y con energia.