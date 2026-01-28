import { FastifyInstance } from "fastify";
import {
    listConversations,
    getConversation,
    setMode,
    canReply,
} from "../services/conversations.store";
import { normalizePhone } from "../services/phone.util";

export async function conversationRoutes(app: FastifyInstance) {

    // 📋 Listar conversaciones (ordenadas por actividad)
    app.get("/api/conversations", async () => {
        return listConversations().map(c => ({
            phone: c.phone,
            lastMessageAt: c.lastMessageAt,
            mode: c.mode,
            needsHuman: c.needsHuman,     // 👈 IMPORTANTE para tu UI
            canReply: canReply(c.phone),
            lastMessage:
                c.messages.length > 0
                    ? c.messages[c.messages.length - 1]
                    : null,
        }));
    });

    // 💬 Obtener historial completo de una conversación
    app.get("/api/conversations/:phone", async (req: any) => {
        const phoneRaw = req.params.phone;
        const phone = normalizePhone(phoneRaw); // 🔑 CLAVE

        return getConversation(phone); // 🟢 NUNCA 404
    });


    // 🔀 Cambiar modo bot ↔ humano
    app.post("/api/conversations/:phone/mode", async (req: any) => {
        const phone = normalizePhone(req.params.phone);
        const { mode } = req.body;

        if (mode !== "bot" && mode !== "human") {
            return { error: "invalid_mode" };
        }

        setMode(phone, mode);
        return { ok: true, mode };
    });


}
