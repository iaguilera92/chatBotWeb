import { ENV } from "../config/env";
const API_URL = ENV.API_URL;


export async function resetAllConversations() {
    console.log("🔹 Llamando al endpoint de reset de conversaciones..."); // log
    const res = await fetch(`${API_URL}/api/conversations/reset-conversations`, {
        method: "POST",
    });

    if (!res.ok) {
        console.error("❌ Falló el reset de conversaciones");
        throw new Error("No se pudo resetear las conversaciones");
    }

    const data = await res.json();
    console.log("✅ Respuesta del backend:", data); // log respuesta
    return data;
}
