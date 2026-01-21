import Fastify from "fastify";
import dotenv from "dotenv";
import cors from "@fastify/cors";
import { whatsappWebhook } from "./webhook";

dotenv.config();

async function startServer() {
    const app = Fastify({ logger: true });

    // ✅ CORS
    await app.register(cors, {
        origin: "*"
    });

    // Webhook WhatsApp
    whatsappWebhook(app);

    // Health check
    app.get("/health", async () => ({ status: "ok" }));

    const port = Number(process.env.PORT) || 3000;

    await app.listen({ port, host: "0.0.0.0" });

    console.log(`\n🚀 Backend running:`);
    console.log(`👉 http://localhost:${port}/health\n`);
}

startServer().catch((err) => {
    console.error("❌ Error starting server:", err);
    process.exit(1);
});
