export async function sendWhatsAppMessage(to: string, body: string) {
    console.log("📤 WhatsApp → Enviando mensaje a:", to);
    console.log("📝 Contenido:", body);

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_TOKEN;
    const formattedTo = to.replace(/\D/g, ""); // +56 9 4687 3014 → 56946873014

    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    console.log("🔗 URL de WhatsApp API:", url);
    console.log("TOKEN INICIO:", token?.slice(0, 10));

    const payload = {
        messaging_product: "whatsapp",
        to: formattedTo,
        type: "text",   // 🔹 Este es el fix
        text: { body },
    };

    console.log("📦 Payload WhatsApp API:", JSON.stringify(payload));

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
}
