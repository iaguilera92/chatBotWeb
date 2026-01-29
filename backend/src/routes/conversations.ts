import { FastifyInstance } from "fastify";
import {
    listConversations,
    getConversation,
    setMode,
} from "../services/conversations.store";
import { normalizePhone } from "../services/phone.util";
import { Conversation } from "../services/conversations.store";

export async function conversationRoutes(app: FastifyInstance) {

    // 📋 Listar conversaciones
    app.get("/api/conversations", async () => {
        const conversations = await listConversations();

        return conversations.map((c: Conversation) => ({
            phone: c.phone,
            lastMessageAt: c.lastMessageAt,
            mode: c.mode,
            needsHuman: c.needsHuman,
            lastMessage:
                c.messages.length > 0
                    ? c.messages[c.messages.length - 1]
                    : null,
        }));
    });

    // 💬 Obtener historial completo
    app.get("/api/conversations/:phone", async (req: any) => {
        const phoneRaw = req.params.phone;
        const phone = normalizePhone(phoneRaw);

        return await getConversation(phone);
    });

    // 🔀 Cambiar modo bot ↔ humano
    app.post("/api/conversations/:phone/mode", async (req: any) => {
        const phone = normalizePhone(req.params.phone);
        const { mode } = req.body;

        if (mode !== "bot" && mode !== "human") {
            return { error: "invalid_mode" };
        }

        await setMode(phone, mode);
        return { ok: true, mode };
    });
}
