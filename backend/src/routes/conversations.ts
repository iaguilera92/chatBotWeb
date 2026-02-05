import { FastifyInstance } from "fastify";
import {
    listConversations,
    getConversation,
    setMode,
    Conversation,
} from "../services/conversations.store";
import { normalizePhone } from "../services/phone.util";

export async function conversationRoutes(app: FastifyInstance) {

    // 📋 Listar conversaciones
    app.get("/api/conversations", async () => {
        const conversations = await listConversations();

        return conversations.map((c) => ({
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
        const phone = normalizePhone(req.params.phone);
        const conversation = await getConversation(phone);

        return {
            phone: conversation.phone,
            mode: conversation.mode,
            needsHuman: conversation.needsHuman,
            lastMessageAt: conversation.lastMessageAt,
            messages: conversation.messages.map((msg) => ({
                from: msg.from,
                text: msg.text,
                ts: msg.ts,
            })),
        };
    });

    // 🔀 Cambiar modo bot ↔ humano
    app.post("/api/conversations/:phone/mode", async (req: any) => {
        const phone = normalizePhone(req.params.phone);
        const { mode } = req.body;

        if (mode !== "bot" && mode !== "human") {
            return { error: "invalid_mode" };
        }

        await setMode(phone, mode);

        // Devuelve la conversación actualizada para que el front la recargue
        const updated = await getConversation(phone);
        return {
            ok: true,
            mode: updated.mode,
            needsHuman: updated.needsHuman,
            messages: updated.messages,
        };
    });
}
