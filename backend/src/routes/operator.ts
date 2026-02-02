import { FastifyInstance } from "fastify";
import { sendWhatsAppMessage } from "../services/whatsapp.service";
import { saveMessage } from "../services/conversations.store";

function normalizePhone(phone?: string): string {
    if (!phone) return "";
    return phone.replace(/\D/g, "");
}

export async function operatorRoutes(app: FastifyInstance) {
    app.post("/api/operator/send", async (req: any, reply) => {
        const { to, text } = req.body || {};

        if (!to || !text) {
            // Log seguro: interpolamos el body en el mensaje
            app.log.warn(`Intento de envío sin 'to' o 'text'. Body: ${JSON.stringify(req.body)}`);
            return reply.code(400).send({ error: "to and text required" });
        }

        const phone = normalizePhone(to);
        if (!phone) {
            app.log.warn(`Teléfono inválido: ${to}`);
            return reply.code(400).send({ error: "invalid phone" });
        }

        app.log.info(`👤 Human → ${phone}: ${text.slice(0, 40)}`);

        try {
            await saveMessage(phone, "human", text);

            await sendWhatsAppMessage(phone, text);
            app.log.info(`📤 Mensaje enviado a WhatsApp: ${phone}`);

            return { ok: true };
        } catch (err) {
            app.log.error(`❌ Error enviando mensaje WhatsApp a ${phone}: ${(err as Error).message}`);
            return reply.code(500).send({ error: "Error enviando mensaje" });
        }
    });
}
