export async function sendWhatsAppMessage(to: string, body: string) {
    const formattedTo = String(to).replace(/\D/g, "");
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_TOKEN;
    const apiVersion = process.env.WHATSAPP_API_VERSION || "v18.0";

    if (!phoneNumberId || !token) {
        console.error("❌ Faltan variables de entorno WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_TOKEN");
        throw new Error("Faltan variables de entorno de WhatsApp API");
    }

    if (process.env.NODE_ENV === "development") {
        console.log("📤 [DEV MODE] Simulando envío a WhatsApp:", formattedTo, body);
        return { simulated: true };
    }

    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    const payload = {
        messaging_product: "whatsapp",
        to: formattedTo,
        type: "text",
        text: { body },
    };

    console.log("📤 WhatsApp → Preparando mensaje para:", formattedTo);
    console.log("🔗 URL:", url);
    console.log("📦 Payload:", JSON.stringify(payload, null, 2));

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        console.log("📥 Respuesta WhatsApp API:", data);

        if (!res.ok) {
            console.error("❌ WhatsApp API error:", data);
            throw new Error(JSON.stringify(data));
        }

        console.log("✅ WhatsApp enviado OK");
        return data;

    } catch (err: any) {
        console.error("❌ Error enviando mensaje a WhatsApp:", err);
        throw err;
    }
}
