import "./env";
import Fastify from "fastify";
import cors from "@fastify/cors";
import formbody from "@fastify/formbody";

import { chatRoutes } from "./routes/chat";
import { whatsappTwilioWebhook } from "./webhook-twilio";

async function startServer() {
    const app = Fastify({ logger: true });

    await app.register(cors, { origin: "*" });
    await app.register(formbody); // ⬅️ CLAVE PARA TWILIO

    whatsappTwilioWebhook(app);
    await chatRoutes(app);

    app.get("/health", async () => ({ status: "ok" }));

    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: "0.0.0.0" });
}
