import { FastifyInstance } from "fastify";
import { sendTextMessage } from "./services/whatsapp";

export function whatsappWebhook(app: FastifyInstance) {
    app.get("/webhook", async (req: any, reply) => {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
            return reply.send(challenge);
        }
        reply.code(403).send("Forbidden");
    });

    app.post("/webhook", async (req: any) => {
        const entry = req.body?.entry?.[0];
        const change = entry?.changes?.[0];
        const message = change?.value?.messages?.[0];

        if (message?.from && message?.text?.body) {
            const from = message.from;
            await sendTextMessage(from, "Hola 👋");
        }

        return { ok: true };
    });

}
