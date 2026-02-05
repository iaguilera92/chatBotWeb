import "../env"; // carga variables de entorno
import { listConversations } from "../services/conversations.store";

async function main() {
    const conversations = await listConversations();

    if (conversations.length === 0) {
        console.log("No hay conversaciones en Redis");
        return;
    }

    console.log("🌟 Conversaciones en Redis:");
    conversations.forEach((c) => {
        console.log(`📞 Teléfono: ${c.phone}`);
        console.log(`   Último mensaje: ${c.lastMessageAt}`);
        console.log(`   Modo: ${c.mode}`);
        console.log(`   Necesita humano: ${c.needsHuman}`);
        console.log(`   Mensajes:`);
        c.messages.forEach((m) => {
            console.log(`      [${new Date(m.ts).toLocaleString()}] ${m.from}: ${m.text}`);
        });
        console.log("------------------------------------------------");
    });
}

main()
    .then(() => console.log("✅ Listado completo"))
    .catch((err) => console.error("❌ Error:", err));
