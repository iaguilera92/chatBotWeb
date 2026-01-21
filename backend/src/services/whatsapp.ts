import axios from "axios";

const BASE_URL = "https://graph.facebook.com/v19.0";

export async function sendTextMessage(to: string, text: string) {
    const url = `${BASE_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    await axios.post(
        url,
        {
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: text }
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                "Content-Type": "application/json"
            }
        }
    );
}
