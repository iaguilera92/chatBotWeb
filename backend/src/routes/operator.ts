import { FastifyInstance } from "fastify";
import { sendWhatsAppMessage } from "../services/whatsapp.service";
import { saveMessage } from "../services/conversations.store";

function normalizePhone(phone: string) {
    return phone.replace(/\D/g, "");
}

export async function operatorRoutes(app: FastifyInstance) {
    app.post("/api/operator/send", async (req: any, reply) => {
        const { to, text } = req.body;

        if (!to || !text) {
            return reply.code(400).send({ error: "to and text required" });
        }

        const phone = normalizePhone(to);

        // 📝 log corto y útil
        app.log.info(`👤 Human → ${phone}: ${text.slice(0, 40)}`);

        // 💾 Guardar en historial
        saveMessage(phone, "human", text);

        // 📤 Enviar a WhatsApp
        await sendWhatsAppMessage(phone, text);

        return { ok: true };
    });
}
