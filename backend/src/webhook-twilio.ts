import { FastifyInstance } from "fastify";
import { handleChat } from "./services/chat.handler";

export function whatsappTwilioWebhook(app: FastifyInstance) {
    app.post("/webhook/whatsapp", async (req: any, reply) => {
        const text = req.body.Body;
        const sessionId = req.body.From; // 🔥 clave

        const messages = [
            { from: "user" as const, text },
        ];

        const response = await handleChat(sessionId, messages, false);

        reply
            .type("application/xml")
            .send(`
        <Response>
          <Message>${response.text}</Message>
        </Response>
      `);
    });
}
