import "./env";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { chatRoutes } from "./routes/chat";
import { whatsappWebhook } from "./webhook";

async function startServer() {
    const app = Fastify({ logger: true });

    await app.register(cors, { origin: "*" });

    whatsappWebhook(app);
    await chatRoutes(app);

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
