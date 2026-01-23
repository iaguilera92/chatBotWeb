import { FastifyInstance } from "fastify";
import { handleChat } from "./services/chat.handler";

export function whatsappTwilioWebhook(app: FastifyInstance) {
    app.post("/webhook/whatsapp", async (req: any, reply) => {
        const text = req.body.Body;

        const messages = [
            { from: "user" as const, text },
        ];

        const responseText = await handleChat(messages);

        reply
            .type("application/xml")
            .send(`
        <Response>
          <Message>${responseText}</Message>
        </Response>
      `);
    });
}
