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
    const res = await fetch(
        `${API_URL}/api/conversations/${phone}/mode`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode }),
        }
    );

    if (!res.ok) throw new Error("No se pudo cambiar el modo");
    return res.json();
}

export async function finishConversationAPI(phone: string) {
    const res = await fetch(`${API_URL}/api/conversations/${phone}/finalizar`, {
        method: "POST",
    });

    if (!res.ok) throw new Error("No se pudo finalizar la conversación");
    return res.json();
}