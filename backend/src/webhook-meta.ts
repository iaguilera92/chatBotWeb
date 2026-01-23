import { FastifyInstance } from "fastify";
import { handleChat } from "./services/chat.handler";

export function whatsappMetaWebhook(app: FastifyInstance) {

    // ✅ VERIFICACIÓN DE WEBHOOK (OBLIGATORIA META)
    app.get("/webhook/whatsapp/meta", async (req: any, reply) => {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        if (
            mode === "subscribe" &&
            token === process.env.WHATSAPP_VERIFY_TOKEN
        ) {
            return reply.send(challenge);
        }

        return reply.code(403).send("Forbidden");
    });

    // 📩 MENSAJES ENTRANTES
    app.post("/webhook/whatsapp/meta", async (req: any, reply) => {
        try {
            const entry = req.body?.entry?.[0];
            const change = entry?.changes?.[0];
            const message = change?.value?.messages?.[0];

            // 🔕 Eventos que no son mensajes
            if (!message || message.type !== "text") {
                return reply.send("EVENT_RECEIVED");
            }

            const from = message.from;
            const text = message.text?.body?.trim();

            if (!text) {
                return reply.send("EVENT_RECEIVED");
            }

            // 🔁 Adaptamos al formato interno del bot
            const messages = [
                { from: "user" as const, text }
            ];

            const responseText = await handleChat(messages);

            // ⚠️ Meta NO espera respuesta directa aquí
            // El envío de mensajes se hace vía Graph API (luego)
            // Por ahora solo confirmamos recepción
            return reply.send("EVENT_RECEIVED");

        } catch (err) {
            app.log.error(err);
            return reply.send("EVENT_RECEIVED");
        }
    });
}
