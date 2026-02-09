// src/routes/reset-conversations.ts
import { FastifyInstance } from "fastify";
import { listConversations, setMode, deleteConversation } from "../services/conversations.store";

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
    /*🧹 LIMPIEZA DE CONVERSACIONES CORRUPTAS (PRD) */
    /* curl -X POST https://pwbot-zfzs.onrender.com/api/conversations/cleanup */
    /* https://pwbot-zfzs.onrender.com/api/conversations/cleanup */
    app.post("/api/conversations/cleanup", async (_req, reply) => {
        try {
            console.log("🧹 [CLEANUP] Inicio limpieza de conversaciones");

            const conversations = await listConversations();

            let deleted = 0;
            let skipped = 0;

            for (const [index, c] of conversations.entries()) {
                const invalidPhone =
                    !c?.phone ||
                    typeof c.phone !== "string" ||
                    c.phone.trim() === "";

                const invalidMessages =
                    !Array.isArray(c?.messages);

                if (invalidPhone || invalidMessages) {
                    console.warn(
                        `⚠️ [CLEANUP] Conversación corrupta [index=${index}] → eliminando`,
                        {
                            phone: c?.phone,
                            messagesType: typeof c?.messages,
                        }
                    );

                    await deleteConversation(c?.phone);
                    deleted++;
                } else {
                    skipped++;
                }
            }

            console.log("✅ [CLEANUP] Limpieza finalizada");
            console.log(`🧹 Eliminadas: ${deleted}`);
            console.log(`➡️ Omitidas (válidas): ${skipped}`);

            return reply.send({
                ok: true,
                deleted,
                skipped,
                total: conversations.length,
            });
        } catch (err) {
            console.error("❌ [CLEANUP] Error limpiando conversaciones:", err);
            return reply.code(500).send({
                ok: false,
                message: "Error limpiando conversaciones",
            });
        }
    });

}
