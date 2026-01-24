export async function sendWhatsAppMessage(to: string, body: string) {
    console.log("📤 WhatsApp → Enviando mensaje a:", to);
    console.log("📝 Contenido:", body);

    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    console.log("TOKEN INICIO:", process.env.WHATSAPP_TOKEN?.slice(0, 10));

    const res = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            text: { body },
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error("❌ WhatsApp API error:", err);
        throw new Error(err);
    }

    console.log("✅ WhatsApp enviado OK");
}
