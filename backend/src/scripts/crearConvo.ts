import "../env"; // 🔑 IMPORTANTE: cargar variables .env
import { saveMessage } from "../services/conversations.store";

async function main() {
    await saveMessage("123456789", "user", "Hola, esto es un test");
    console.log("Conversación creada con mensajes!");
}

main().catch(console.error);
