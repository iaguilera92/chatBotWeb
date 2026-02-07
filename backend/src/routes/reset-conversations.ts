// src/routes/reset-conversations.ts
import { FastifyInstance } from "fastify";
import { listConversations, setMode } from "../services/conversations.store";

export async function resetConversationsRoutes(app: FastifyInstance) {
    app.post("/api/conversations/reset-conversations", async (req, reply) => {
        try {
            console.log("🔹 Endpoint /reset-conversations llamado"); // log inicial

            const conversations = await listConversations();
            console.log("🔹 Conversaciones encontradas:", conversations.map(c => ({ phone: c.phone, mode: c.mode })));

            await Promise.all(conversations.map((c) => {
                console.log(`🔹 Reseteando conversación: ${c.phone} -> bot`);
                return setMode(c.phone, "bot");
            }));

            console.log("✅ Todas las conversaciones fueron reseteadas a CONTROL BOT");

            return reply.send({
                ok: true,
                message: "Todas las conversaciones fueron reseteadas a CONTROL BOT",
                count: conversations.length,
            });
        } catch (err) {
            console.error("❌ Error reseteando conversaciones:", err);
            return reply.code(500).send({
                ok: false,
                message: "Error reseteando conversaciones",
            });
        }
    });

}
