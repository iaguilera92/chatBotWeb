import "./env";

import Fastify from "fastify";
import cors from "@fastify/cors";
import { chatRoutes } from "./routes/chat";
import { whatsappMetaWebhook } from "./webhook-meta";
import { operatorRoutes } from "./routes/operator";
import { conversationRoutes } from "./routes/conversations";
import { resetConversationsRoutes } from "./routes/reset-conversations";

async function startServer() {
    const app = Fastify({ logger: true });

    // ✅ CORS
    await app.register(cors, { origin: "*" });

    // 🔗 Rutas API
    whatsappMetaWebhook(app);        // /webhook/whatsapp/meta
    await chatRoutes(app);           // POST /api/chat
    await operatorRoutes(app);       // /api/operator/*
    await conversationRoutes(app);   // /api/conversations/*
    await resetConversationsRoutes(app);

    // ❤️ Healthcheck
    app.get("/health", async () => ({ status: "ok" }));

    const port = Number(process.env.PORT) || 3000;

    await app.listen({ port, host: "0.0.0.0" });

    console.log("\n🚀 Backend running");
    console.log(`👉 http://localhost:${port}/health\n`);
}

startServer().catch((err) => {
    console.error("❌ Error starting server:", err);
    process.exit(1);
});
