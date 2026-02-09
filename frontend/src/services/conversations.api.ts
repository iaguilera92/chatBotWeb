import { ENV } from "../config/env";

const API_URL = ENV.API_URL;

export async function getConversations() {
    try {
        const res = await fetch(`${API_URL}/api/conversations`);
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}


export async function getConversation(phone: string) {
    const res = await fetch(`${API_URL}/api/conversations/${phone}`);
    if (!res.ok) throw new Error("Conversación no encontrada");
    return res.json();
}

// 🔁 EXPORT QUE FALTABA
export async function setConversationMode(
    phone: string,
    mode: "bot" | "human"
) {
    console.log("🌐 setConversationMode llamado con:", { phone, mode }); // 🔹 log entrada

    const res = await fetch(`${API_URL}/api/conversations/${phone}/mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
    });

    console.log("📡 Respuesta raw del fetch:", res); // 🔹 log response objeto

    if (!res.ok) {
        console.error("❌ No se pudo cambiar el modo", res.status, res.statusText);
        throw new Error("No se pudo cambiar el modo");
    }

    const data = await res.json();
    console.log("✅ setConversationMode result:", data); // 🔹 log resultado JSON

    return data;
}


export async function finishConversationAPI(phone: string) {
    const res = await fetch(`${API_URL}/api/conversations/${phone}/finalizar`, {
        method: "POST",
    });

    if (!res.ok) throw new Error("No se pudo finalizar la conversación");
    return res.json();
}