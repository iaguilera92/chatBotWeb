import { FastifyInstance } from "fastify";
import { handleChat } from "./services/chat.handler";
import { sendWhatsAppMessage } from "./services/whatsapp.service";
import {
    saveMessage,
    getConversation,
    setMode,
} from "./services/conversations.store";

/**
 * Detecta si el usuario solicita hablar con un humano
 */
function shouldEscalateToHuman(text: string): boolean {
    const keywords = ["ejecutivo", "persona", "humano", "agente", "hablar"];
    return keywords.some(k => text.toLowerCase().includes(k));
}

/**
 * Webhook WhatsApp Cloud API (Meta)
 */
export function whatsappMetaWebhook(app: FastifyInstance) {

    // 🔐 Verificación obligatoria del webhook (Meta)
    app.get("/webhook/whatsapp/meta", async (req: any, reply) => {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
            return reply.send(challenge);
        }

        return reply.code(403).send("Forbidden");
    });

    // 📩 Mensajes entrantes desde WhatsApp
    app.post("/webhook/whatsapp/meta", async (req: any, reply) => {
        try {
            const message =
                req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

            // Ignorar eventos no-texto
            if (!message || message.type !== "text") {
                return reply.send("EVENT_RECEIVED");
            }

            const from = message.from;
            const text = message.text?.body?.trim();
            if (!text) return reply.send("EVENT_RECEIVED");

            // 💾 Guardar mensaje del usuario
            saveMessage(from, "user", text);

            // 🔁 Estado actual de la conversación
            const convo = getConversation(from);

            // 👤 Si está en modo humano, el bot se silencia
            if (convo.mode === "human") {
                return reply.send("EVENT_RECEIVED");
            }

            // 🔀 Solicitud explícita de humano
            if (shouldEscalateToHuman(text)) {
                setMode(from, "human");

                const notice =
                    "👤 Te comunico con un ejecutivo, un momento por favor.";

                saveMessage(from, "bot", notice);
                await sendWhatsAppMessage(from, notice);

                return reply.send("EVENT_RECEIVED");
            }

            // 🤖 Bot activo
            const responseText = await handleChat([
                { from: "user" as const, text },
            ]);

            saveMessage(from, "bot", responseText);
            await sendWhatsAppMessage(from, responseText);

            return reply.send("EVENT_RECEIVED");
        } catch (err) {
            app.log.error(err);
            return reply.send("EVENT_RECEIVED");
        }
    });
}
