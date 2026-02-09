import { FastifyInstance } from "fastify";
import {
    listConversations,
    getConversation,
    setMode,
    finishConversation,
    deleteConversation
} from "../services/conversations.store";
import { Conversation } from "../models/Conversations";
import { normalizePhone } from "../services/phone.util";

//ESTADOS CONVERSACIONES
function getStatus(convo: Conversation) {
    if (convo.finished) return "EN ESPERA";           // Finalizada → EN ESPERA
    if (convo.mode === "bot" && convo.needsHuman) return "EN ESPERA"; // espera atención
    if (convo.mode === "bot" && !convo.needsHuman) return "CONTROL BOT"; // solo bot
    if (convo.mode === "human") return "ATENDIDA";   // atendido
    return "DESCONOCIDO";
}
export async function conversationRoutes(app: FastifyInstance) {

    // 📋 Listar conversaciones
    app.get("/api/conversations", async () => {
        try {
            const conversations = await listConversations();

            console.log("📄 Listado de conversaciones (DEBUG):");

            conversations.forEach((c, index) => {
                try {
                    // 🛡️ Blindaje básico
                    const phone = c?.phone ?? "<SIN PHONE>";
                    const messages = Array.isArray(c?.messages) ? c.messages : [];

                    if (!c?.phone) {
                        console.warn(
                            `⚠️ Conversación inválida [index=${index}] → phone vacío`,
                            c
                        );
                    }

                    if (!Array.isArray(c?.messages)) {
                        console.warn(
                            `⚠️ Conversación con messages corrupto [phone=${phone}]`,
                            { messages: c?.messages }
                        );
                    }

                    const status = getStatus(c);

                    const date =
                        typeof c?.lastMessageAt === "number" && c.lastMessageAt > 0
                            ? new Date(c.lastMessageAt)
                            : messages.length > 0
                                ? new Date(messages[messages.length - 1].ts)
                                : null;

                    const timeStr = date
                        ? `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
                        : "??:??";

                    console.log(
                        `- ${phone} | mode: ${c.mode} | needsHuman: ${c.needsHuman} | finished: ${c.finished} | status: ${status} | lastMessage: ${timeStr}`
                    );

                } catch (innerErr) {
                    console.error(
                        `💥 Error procesando conversación [index=${index}]`,
                        innerErr,
                        c
                    );
                }
            });

            return conversations
                // ⛔ Filtrar conversaciones rotas antes de enviar al front
                .filter((c) => typeof c?.phone === "string" && c.phone.trim() !== "")
                .map((c) => {
                    const messages = Array.isArray(c.messages) ? c.messages : [];
                    const lastMessage =
                        messages.length > 0 ? messages[messages.length - 1] : null;

                    return {
                        phone: c.phone,
                        lastMessageAt:
                            typeof c.lastMessageAt === "number"
                                ? c.lastMessageAt
                                : lastMessage
                                    ? lastMessage.ts
                                    : Date.now(),
                        mode: c.mode,
                        needsHuman: c.needsHuman,
                        status: getStatus(c),
                        lastMessage,
                    };
                });

        } catch (err) {
            console.error("❌ Error crítico en /api/conversations", err);

            // 🔒 JAMÁS romper el front
            return [];
        }
    });



    // 💬 Obtener historial completo
    app.get("/api/conversations/:phone", async (req: any) => {
        const phone = normalizePhone(req.params.phone);
        const conversation = await getConversation(phone);

        // Extraemos datos del lead si existen
        const leadEmail = conversation.leadEmail ?? null;
        const leadBusiness = conversation.leadBusiness ?? null;
        const leadOffer = conversation.leadOffer ?? null;

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
            // Datos del cliente
            leadEmail,
            leadBusiness,
            leadOffer,
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

    app.post("/api/conversations/:phone/finalizar", async (req: any) => {
        const phone = normalizePhone(req.params.phone);
        const convo = await finishConversation(phone);

        return { ok: true, conversation: convo };
    });

    // 🗑️ Eliminar conversación completa
    app.delete("/api/conversations/:phone", async (req: any) => {
        const phone = normalizePhone(req.params.phone);

        await deleteConversation(phone);

        return { ok: true };
    });
}

