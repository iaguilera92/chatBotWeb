import { FastifyInstance } from "fastify";
import { handleChat } from "./services/chat.handler";
import { sendWhatsAppMessage } from "./services/whatsapp.service";
import { saveMessage, getConversation, setMode } from "./services/conversations.store";
import { normalizePhone } from "./services/phone.util";

export function whatsappMetaWebhook(app: FastifyInstance) {

    // 🔐 Verificación del webhook Meta
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
            console.log("📩 WEBHOOK FULL:", JSON.stringify(req.body, null, 2));

            const value = req.body?.entry?.[0]?.changes?.[0]?.value;
            if (!value || !Array.isArray(value.messages)) return reply.send("EVENT_RECEIVED");

            const message = value.messages.find((m: any) => m.type === "text");
            if (!message) return reply.send("EVENT_RECEIVED");

            const from = normalizePhone(message.from);
            const text = message.text?.body?.trim();
            if (!from || !text) return reply.send("EVENT_RECEIVED");

            // 💾 Guardamos mensaje entrante
            await saveMessage(from, "user", text);
            const convo = await getConversation(from);

            // 👤 Modo humano
            if (convo.mode === "human") return reply.send("EVENT_RECEIVED");

            // 🔀 Escalamiento a humano
            const humanKeywords = ["ejecutivo", "persona", "humano", "agente", "hablar", "asesor"];
            if (humanKeywords.some(k => text.toLowerCase().includes(k))) {
                await setMode(from, "human");
                const notice = "👤 Te comunico con un ejecutivo, un momento por favor.";
                await saveMessage(from, "bot", notice);
                await sendWhatsAppMessage(from, notice);
                return reply.send("EVENT_RECEIVED");
            }

            // 🤖 Llamamos al bot
            const botReply = await handleChat(convo.messages.map(m => ({
                from: m.from === "bot" ? "bot" : "user",
                text: m.text,
            })));

            if (botReply?.trim()) {
                await saveMessage(from, "bot", botReply);
                await sendWhatsAppMessage(from, botReply);
            }

            return reply.send("EVENT_RECEIVED");

        } catch (err) {
            console.error("❌ Error en webhook WhatsApp:", err);
            return reply.send("EVENT_RECEIVED");
        }
    });
}
