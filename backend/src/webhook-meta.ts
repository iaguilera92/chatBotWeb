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
            console.log("📩 WEBHOOK FULL:", JSON.stringify(req.body, null, 2));

            const value = req.body?.entry?.[0]?.changes?.[0]?.value;

            if (!value || !Array.isArray(value.messages)) {
                return reply.send("EVENT_RECEIVED");
            }

            /* =================================================
               🔐 VALIDAR phone_number_id (CRÍTICO)
               - Evita responder a payloads mock / sandbox
            ================================================= */
            const incomingPhoneNumberId = value?.metadata?.phone_number_id;

            // 🔓 En desarrollo / sandbox NO validamos phone_number_id
            if (
                process.env.NODE_ENV === "production" &&
                incomingPhoneNumberId &&
                incomingPhoneNumberId !== process.env.WHATSAPP_PHONE_NUMBER_ID
            ) {
                console.log(
                    "⚠️ Webhook ignorado (phone_number_id no coincide):",
                    incomingPhoneNumberId
                );
                return reply.send("EVENT_RECEIVED");
            }


            const message = value.messages.find((m: any) => m.type === "text");
            if (!message) {
                return reply.send("EVENT_RECEIVED");
            }

            const from = normalizePhone(message.from);
            const text = message.text?.body?.trim();

            if (!from || !text) {
                return reply.send("EVENT_RECEIVED");
            }

            /* =================================================
               💾 Guardar mensaje SIEMPRE
            ================================================= */
            saveMessage(from, "user", text);

            const convo = getConversation(from);

            /* =================================================
               👤 MODO HUMANO
            ================================================= */
            if (convo.mode === "human") {
                return reply.send("EVENT_RECEIVED");
            }

            /* =================================================
               🔀 Escalar a humano
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
                convo.messages
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
