import { FastifyInstance } from "fastify";
import { handleChat, UiMessage } from "./services/chat.handler";
import { sendWhatsAppMessage } from "./services/whatsapp.service";
import {
    saveMessage,
    getConversation,
    setMode,
} from "./services/conversations.store";
import { normalizePhone } from "./services/phone.util";

function shouldEscalateToHuman(text: string): boolean {
    const keywords = ["ejecutivo", "persona", "humano", "agente", "hablar"];
    return keywords.some(k => text.toLowerCase().includes(k));
}

export function whatsappMetaWebhook(app: FastifyInstance) {

    // 🔐 Verificación webhook Meta
    app.get("/webhook/whatsapp/meta", async (req: any, reply) => {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
            return reply.send(challenge);
        }

        return reply.code(403).send("Forbidden");
    });

    // 📩 Mensajes entrantes
    app.post("/webhook/whatsapp/meta", async (req: any, reply) => {
        try {
            const message =
                req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

            if (!message || message.type !== "text") {
                return reply.send("EVENT_RECEIVED");
            }

            const from = normalizePhone(message.from);
            const text = message.text?.body?.trim();

            if (!from || !text) {
                return reply.send("EVENT_RECEIVED");
            }

            // 💾 Guardar mensaje del cliente
            saveMessage(from, "user", text);

            const convo = getConversation(from);

            // 👤 Modo humano → bot silenciado
            if (convo.mode === "human") {
                return reply.send("EVENT_RECEIVED");
            }

            // 🔀 Escalar a humano
            if (shouldEscalateToHuman(text)) {
                setMode(from, "human");

                const notice =
                    "👤 Te comunico con un ejecutivo, un momento por favor.";

                saveMessage(from, "bot", notice);
                await sendWhatsAppMessage(from, notice);

                return reply.send("EVENT_RECEIVED");
            }

            // 🤖 Construir contexto SOLO para la IA
            const aiContext = convo.messages
                .filter(m => m.from === "user" || m.from === "bot")
                .map(m => ({
                    from: m.from as "user" | "bot",
                    text: m.text ?? "",
                }));



            const responseText = await handleChat(aiContext);

            saveMessage(from, "bot", responseText);
            await sendWhatsAppMessage(from, responseText);

            return reply.send("EVENT_RECEIVED");
        } catch (err) {
            app.log.error(err);
            return reply.send("EVENT_RECEIVED");
        }
    });
}
