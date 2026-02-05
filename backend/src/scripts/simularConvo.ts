import "../env"; // Para que cargue REDIS_URL
import { saveMessage, getConversation } from "../services/conversations.store";

async function main() {
    const clientNumber = "+56992914526"; // tú
    const botNumber = "+15551919322";    // bot

    // Mensajes que quieres que el cliente envíe
    const mensajesCliente = [
        "Hola bot, ¿cómo estás?",
        "¿Qué servicios ofreces?",
        "Gracias, eso es todo."
    ];

    for (const texto of mensajesCliente) {
        console.log(`📩 Cliente dice: ${texto}`);
        // Guardamos el mensaje del cliente
        await saveMessage(clientNumber, "user", texto);

        // Generamos respuesta del bot (puede ser más avanzada con IA)
        const respuestaBot = `Bot responde a: "${texto}"`;
        console.log(`🤖 Bot responde: ${respuestaBot}`);
        await saveMessage(clientNumber, "bot", respuestaBot);
    }

    // Mostramos la conversación completa
    const convo = await getConversation(clientNumber);
    console.log("\n🌟 Conversación completa:");
    convo.messages.forEach((m) => {
        const fecha = new Date(m.ts).toLocaleString();
        console.log(`[${fecha}] ${m.from}: ${m.text}`);
    });
}

main().catch(console.error);
