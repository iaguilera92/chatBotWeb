import "./env";
import Fastify from "fastify";
import cors from "@fastify/cors";
import formbody from "@fastify/formbody";

import { chatRoutes } from "./routes/chat";
//import { whatsappTwilioWebhook } from "./webhook-twilio";
import { whatsappMetaWebhook } from "./webhook-meta";
import { operatorRoutes } from "./routes/operator";
import { conversationRoutes } from "./routes/conversations";


async function startServer() {
    const app = Fastify({ logger: true });

    // 🔴 ORDEN CRÍTICO
    await app.register(formbody);
    await app.register(cors, { origin: "*" });

    // 🔗 Rutas
    //whatsappTwilioWebhook(app); // /webhook/whatsapp/twilio
    whatsappMetaWebhook(app);   // /webhook/whatsapp/meta
    await chatRoutes(app);      // POST /api/chat
    await operatorRoutes(app); //OPERADOR PANEL-HUMANO
    await conversationRoutes(app); //HISTORIAL PANEL-HUMANO

    // ❤️ Healthcheck
    app.get("/health", async () => ({ status: "ok" }));

    const port = Number(process.env.PORT) || 3000;

    await app.listen({ port, host: "0.0.0.0" });

    console.log(`\n🚀 Backend running`);
    console.log(`👉 http://localhost:${port}/health\n`);
}

startServer().catch((err) => {
    console.error("❌ Error starting server:", err);
    process.exit(1);
});
