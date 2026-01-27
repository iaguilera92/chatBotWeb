import { FastifyInstance } from "fastify";
import { handleChat } from "./services/chat.handler";
import { sendWhatsAppMessage } from "./services/whatsapp.service";
import {
    saveMessage,
    getConversation,
    setMode,
} from "./services/conversations.store";
import { normalizePhone } from "./services/phone.util";

/** Detecta intención de hablar con humano */
function shouldEscalateToHuman(text: string): boolean {
    const keywords = [
        "ejecutivo",
        "persona",
        "humano",
        "agente",
        "hablar",
        "asesor",
    ];
    return keywords.some(k => text.toLowerCase().includes(k));
}

export function whatsappMetaWebhook(app: FastifyInstance) {

    /* =====================================================
       🔐 Verificación webhook Meta (OBLIGATORIO)
    ===================================================== */
    app.get("/webhook/whatsapp/meta", async (req: any, reply) => {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
            return reply.send(challenge);
        }

        return reply.code(403).send("Forbidden");
    });

    /* =====================================================
       📩 Mensajes entrantes desde WhatsApp
    ===================================================== */
    app.post("/webhook/whatsapp/meta", async (req: any, reply) => {
        try {
            const message =
                req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

            // Solo texto (por ahora)
            if (!message || message.type !== "text") {
                return reply.send("EVENT_RECEIVED");
            }

            const from = normalizePhone(message.from);
            const text = message.text?.body?.trim();

            if (!from || !text) {
                return reply.send("EVENT_RECEIVED");
            }

            /* =================================================
               💾 SIEMPRE guardar mensaje del cliente
               (independiente del modo)
            ================================================= */
            saveMessage(from, "user", text);

            const convo = getConversation(from);

            /* =================================================
               👤 MODO HUMANO
               - Bot NO responde
               - Mensajes NO se pierden
            ================================================= */
            if (convo.mode === "human") {
                return reply.send("EVENT_RECEIVED");
            }

            /* =================================================
               🔀 Escalar a humano (intención detectada)
            ================================================= */
            if (shouldEscalateToHuman(text)) {
                setMode(from, "human");

                const notice =
                    "👤 Te comunico con un ejecutivo, un momento por favor.";

                saveMessage(from, "bot", notice);
                await sendWhatsAppMessage(from, notice);

                return reply.send("EVENT_RECEIVED");
            }

            /* =================================================
               🤖 BOT ACTIVO
            ================================================= */
            const responseText = await handleChat(
                getConversation(from).messages
                    .filter(m => m.from !== "human")
                    .map(m => ({
                        from: m.from === "bot" ? "bot" : "user",
                        text: m.text,
                    }))
            );

            if (responseText && responseText.trim()) {
                saveMessage(from, "bot", responseText);
                await sendWhatsAppMessage(from, responseText);
            }

            return reply.send("EVENT_RECEIVED");
        } catch (err) {
            app.log.error(err);
            return reply.send("EVENT_RECEIVED");
        }
    });
}
