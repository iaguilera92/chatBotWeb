import { FastifyInstance } from "fastify";
import {
    listConversations,
    getConversation,
    setMode,
    canReply,
} from "../services/conversations.store";

export async function conversationRoutes(app: FastifyInstance) {

    // 📋 Listar conversaciones (ordenadas por actividad)
    app.get("/api/conversations", async () => {
        return listConversations().map(c => ({
            phone: c.phone,
            lastMessageAt: c.lastMessageAt,
            mode: c.mode,
            canReply: canReply(c.phone),
            lastMessage:
                c.messages.length > 0
                    ? c.messages[c.messages.length - 1]
                    : null,
        }));
    });

    // 💬 Obtener historial completo de una conversación
    app.get("/api/conversations/:phone", async (req: any, reply) => {
        const { phone } = req.params;
        const convo = getConversation(phone);

        if (!convo || convo.messages.length === 0) {
            return reply.code(404).send({ error: "conversation_not_found" });
        }

        return convo;
    });

    // 🔀 Cambiar modo bot ↔ humano
    app.post("/api/conversations/:phone/mode", async (req: any) => {
        const { phone } = req.params;
        const { mode } = req.body;

        if (mode !== "bot" && mode !== "human") {
            return { error: "invalid_mode" };
        }

        setMode(phone, mode);
        return { ok: true, mode };
    });
}
