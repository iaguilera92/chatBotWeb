import { FastifyInstance } from "fastify";
import { sendWhatsAppMessage } from "../services/whatsapp.service";

export async function operatorRoutes(app: FastifyInstance) {
    app.post("/api/operator/send", async (req: any, reply) => {
        const { to, text } = req.body;

        if (!to || !text) {
            return reply.code(400).send({ error: "to and text required" });
        }

        await sendWhatsAppMessage(to, text);
        return { ok: true };
    });
}
