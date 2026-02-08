import { ENV } from "../config/env";

const API_URL = ENV.API_URL;

export async function deleteConversation(phone: string) {
    console.log("🗑️ Eliminando conversación:", phone);

    const res = await fetch(`${API_URL}/api/conversations/${phone}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        console.error("❌ Error al eliminar la conversación");
        throw new Error("No se pudo eliminar la conversación");
    }

    const data = await res.json();
    console.log("✅ Conversación eliminada:", data);

    return data;
}
