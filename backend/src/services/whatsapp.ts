import axios from "axios";

const BASE_URL = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || "v19.0"}`;

export async function sendTextMessage(to: string, text: string) {
    const formattedTo = String(to).replace(/\D/g, "");
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_TOKEN;

    if (!phoneNumberId || !token) {
        console.error("❌ Faltan variables de entorno WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_TOKEN");
        throw new Error("Faltan variables de entorno de WhatsApp API");
    }

    // Modo desarrollo: no envía mensajes reales
    if (process.env.NODE_ENV === "development") {
        console.log("📤 [DEV MODE] Simulando envío a WhatsApp:", formattedTo, text);
        return { simulated: true };
    }

    const url = `${BASE_URL}/${phoneNumberId}/messages`;
    const payload = {
        messaging_product: "whatsapp",
        to: formattedTo,
        type: "text",
        text: { body: text }
    };

    try {
        const res = await axios.post(url, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        console.log("📥 WhatsApp API respuesta:", res.data);
        return res.data;

    } catch (err: any) {
        console.error("❌ Error enviando mensaje a WhatsApp:", err.response?.data || err.message);
        throw err;
    }
}
