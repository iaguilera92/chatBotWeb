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
npm install -g ngrok

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
    - Groq USD 10 · WhatsApp Cloud API USD 10

- PWBot IA + Panel Humano:
  - $29.990 CLP (mensual)

Docker - Redis Local
(Ubuntun credenciales)
iaguilera92
pass (La de siempre)
INICIAR REDIS DESDE UBUNTU (Docker): sudo service redis-server start
CREAR CONVERSACIÓN: npx ts-node src/scripts/crearConvo.ts
CREAR LISTADO: npx ts-node src/scripts/listarConvos.ts

N° BOT: 56946873014
PHONE NUMBER ID (PRD): 902796302924417

ESTRUCTURA:
Estoy desarrollando un chatbot con Groq usando REACT Node.js, tengo dos capas (backend/frontend),
tengo interfaz para simular un chat con wsp, en backend/src tengo mis prompts, routes y services, en la raiz el .env, uso Fastify.
En el frontend tengo public, src esta App.jsx (tengo carpeta components, config,pages, services). 
Uso Brevo para mis correos automatizados. En mi local uso Docker para usar Redis (para las conversaciones).
Mi hosting es Render ya tengo publicado API y FRONT. Estoy usando WhatsApp Cloud API (Meta) para mi N° fono.
Uso Redis en mi Render para guardar las conversaciones, tengo un panel humano, historial de conversaciones e iniciar conversacion.
Habla resumido y con energia. Actualmente esta en revisión mi CLOUD API WSP para que me habiliten el telefono y estamos probando, Ya tengo mi token permanente y mi numero conectado.


Actualmente:
ahora el objetivo es que yo le hable al numero de prueba que me dio wsp cloud api 
‎15551919322 desde mi telefono personal 56992914526, y 15551919322 me responda usando la API https://pwbot-zfzs.onrender.com/webhook/whatsapp/meta del chatbot identificador de la app 4874426486116979



https://pwbot-zfzs.onrender.com/webhook/whatsapp/meta?hub.mode=subscribe&hub.verify_token=pwbot_verify_token&hub.challenge=123456