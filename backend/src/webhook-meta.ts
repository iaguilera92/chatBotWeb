import { FastifyInstance } from "fastify";
import { handleChat } from "./services/chat.handler";
import { sendWhatsAppMessage } from "./services/whatsapp.service";
import { saveMessage, getConversation, setMode } from "./services/conversations.store";
import { normalizePhone } from "./services/phone.util";

export function whatsappMetaWebhookTest(app: FastifyInstance) {

    // 🔐 Verificación del webhook Meta
    app.get("/webhook/whatsapp/meta", async (req: any, reply) => {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
            console.log("✅ Webhook verificado correctamente");
            return reply.send(challenge);
        }

        console.warn("❌ Intento de verificación fallido");
        return reply.code(403).send("Forbidden");
    });

    // 📩 Mensajes entrantes desde WhatsApp (modo prueba: siempre responde)
    app.post("/webhook/whatsapp/meta", async (req: any, reply) => {
        try {
            console.log("📩 WEBHOOK FULL:", JSON.stringify(req.body, null, 2));

            // Normalizamos payload (soporta prueba o real)
            const value = req.body?.entry?.[0]?.changes?.[0]?.value || req.body.value || req.body;

            if (!value || !Array.isArray(value.messages)) {
                console.log("⚠️ No hay mensajes en este webhook");
                return reply.send("EVENT_RECEIVED");
            }

            const message = value.messages.find((m: any) => m.type === "text");
            if (!message) {
                console.log("⚠️ Mensaje no es de texto, se ignora");
                return reply.send("EVENT_RECEIVED");
            }

            const from = normalizePhone(message.from);
            const text = message.text?.body?.trim();

            console.log("📱 Número cliente normalizado:", from);
            console.log("✉️ Texto recibido:", text);

            if (!from || !text) {
                console.warn("❌ Número o texto inválido, se ignora");
                return reply.send("EVENT_RECEIVED");
            }

            // 💾 Guardamos mensaje entrante
            await saveMessage(from, "user", text);

            // 🚨 TEST: enviar mensaje de prueba directamente (opcional)
            // await sendWhatsAppMessage(from, "Hola desde el bot de prueba!");

            const convo = await getConversation(from);
            console.log("🗂️ Conversación completa:", convo);

            // 🔀 Ignoramos modo humano temporalmente
            // if (convo.mode === "human") return reply.send("EVENT_RECEIVED");

            // 🤖 Llamamos al bot
            const botReply = await handleChat(convo.messages.map(m => ({
                from: m.from === "bot" ? "bot" : "user",
                text: m.text,
            })));

            console.log("📋 Mensajes al bot:", convo.messages);
            console.log("🤖 Respuesta del bot:", botReply);

            if (botReply?.trim()) {
                await saveMessage(from, "bot", botReply);
                console.log("📤 El bot respondería:", botReply);

                // 🔹 Enviar mensaje real a WhatsApp
                await sendWhatsAppMessage(from, botReply); // 🔹 Descomenta esta línea
            }
            else {
                console.log("⚠️ Bot no generó respuesta");
            }

            return reply.send("EVENT_RECEIVED");

        } catch (err) {
            console.error("❌ Error en webhook WhatsApp:", err);
            return reply.send("EVENT_RECEIVED");
        }
    });
}
