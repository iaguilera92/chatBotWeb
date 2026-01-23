import { FastifyInstance } from "fastify";
import { handleChat } from "./services/chat.handler";
import { sendWhatsAppMessage } from "./services/whatsapp.service";

export function whatsappMetaWebhook(app: FastifyInstance) {

    app.get("/webhook/whatsapp/meta", async (req: any, reply) => {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
            return reply.send(challenge);
        }

        return reply.code(403).send("Forbidden");
    });

    app.post("/webhook/whatsapp/meta", async (req: any, reply) => {
        try {
            const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

            if (!message || message.type !== "text") {
                return reply.send("EVENT_RECEIVED");
            }

            const from = message.from;
            const text = message.text?.body?.trim();
            if (!text) return reply.send("EVENT_RECEIVED");

            const messages = [{ from: "user" as const, text }];

            const responseText = await handleChat(messages);

            await sendWhatsAppMessage(from, responseText);

            return reply.send("EVENT_RECEIVED");
        } catch (err) {
            app.log.error(err);
            return reply.send("EVENT_RECEIVED");
        }
    });
}
