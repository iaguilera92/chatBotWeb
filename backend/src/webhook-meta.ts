import { FastifyInstance } from "fastify";
import { handleChat } from "./services/chat.handler";
import { sendWhatsAppMessage } from "./services/whatsapp.service";
import { saveMessage, getConversation } from "./services/conversations.store";
import { normalizePhone } from "./services/phone.util";

export function whatsappMetaWebhook(app: FastifyInstance) {

    // 🔐 Verificación del webhook Meta
    app.get("/webhook/whatsapp/meta", async (req: any, reply) => {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
            console.log("[Webhook] ✅ Verificado correctamente");
            return reply.send(challenge);
        }

        console.warn("[Webhook] ❌ Verificación fallida");
        return reply.code(403).send("Forbidden");
    });

    // 📩 Mensajes entrantes desde WhatsApp
    app.post("/webhook/whatsapp/meta", async (req: any, reply) => {
        try {
            const body = req.body;
            const env = process.env.NODE_ENV || "development";
            console.log(`[Webhook][${env}] 📩 Payload recibido:`, JSON.stringify(body));

            // Compatibilidad sandbox + real
            const entryValue = body?.entry?.[0]?.changes?.[0]?.value || body.value || body;

            if (!entryValue || !Array.isArray(entryValue.messages)) {
                console.log(`[Webhook][${env}] ⚠️ No hay mensajes en este webhook`);
                return reply.send("EVENT_RECEIVED");
            }

            // Tomamos solo el primer mensaje de texto
            const message = entryValue.messages.find((m: any) => m.type === "text");
            if (!message) {
                console.log(`[Webhook][${env}] ⚠️ Mensaje no es de texto, se ignora`);
                return reply.send("EVENT_RECEIVED");
            }

            const from = normalizePhone(message.from);
            const text = message.text?.body?.trim();

            if (!from || !text) {
                console.warn(`[Webhook][${env}] ❌ Número o texto inválido, se ignora`);
                return reply.send("EVENT_RECEIVED");
            }

            console.log(`[Webhook][${env}] 📱 Número cliente:`, from);
            console.log(`[Webhook][${env}] ✉️ Texto recibido:`, text);

            // Guardamos mensaje entrante
            await saveMessage(from, "user", text);

            // Obtenemos la conversación completa
            const convo = await getConversation(from);
            console.log(`[Webhook][${env}] 🗂️ Conversación completa:`, convo);

            // Llamamos al bot
            const botReply = await handleChat(convo.messages.map(m => ({
                from: m.from === "bot" ? "bot" : "user",
                text: m.text,
            })));

            console.log(`[Webhook][${env}] 🤖 Respuesta del bot:`, botReply);

            if (botReply?.trim()) {
                await saveMessage(from, "bot", botReply);

                // 🔹 Enviar siempre, incluso en desarrollo
                await sendWhatsAppMessage(from, botReply);
                console.log(`[Webhook][${process.env.NODE_ENV || "development"}] ✅ Mensaje enviado a WhatsApp a:`, from);
            }

            else {
                console.log(`[Webhook][${env}] ⚠️ Bot no generó respuesta`);
            }

            return reply.send("EVENT_RECEIVED");

        } catch (err) {
            console.error("[Webhook] ❌ Error procesando mensaje:", err);
            return reply.send("EVENT_RECEIVED");
        }
    });
}
