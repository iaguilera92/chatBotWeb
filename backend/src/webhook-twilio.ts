import { FastifyInstance } from "fastify";
import { handleChat } from "./services/chat.handler";

async function procesarMensaje(texto: string, from: string): Promise<string> {
    return `Recibido: ${texto}`;
}

export function whatsappTwilioWebhook(app: FastifyInstance) {
    app.post("/webhook/whatsapp", async (req: any, reply) => {
        const from = req.body.From;
        const body = req.body.Body;

        const respuesta = await procesarMensaje(body, from);

        reply
            .type("application/xml")
            .send(`
      <Response>
        <Message>${respuesta}</Message>
      </Response>
    `);
    });

}
