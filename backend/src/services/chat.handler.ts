import { sendToAI } from "./groq.service";
import { sendLeadEmail } from "./email.service";
import { botStatus } from "../state/botStatus";

// Tipos reutilizados

export type UiMessage = {
    from: "user" | "bot";
    text?: string | null;
    image?: string;
    video?: string;
    status?: "sent" | "delivered" | "seen";
    timestamp?: string | Date;
};

type AiMessage = {
    role: "user" | "assistant";
    content: string;
};

// Utils

function getPreviousUserText(
    messages: UiMessage[],
    beforeIndex: number
): string | null {
    for (let i = beforeIndex - 1; i >= 0; i--) {
        const m = messages[i];
        if (m.from === "user" && typeof m.text === "string") {
            return m.text.trim();
        }
    }
    return null;
}

// HANDLER PRINCIPAL

export async function handleChat(messages: UiMessage[]): Promise<string> {
    try {
        /* 🟢 Validación base */
        if (!messages || messages.length === 0) {
            return "💡 ¿En qué podemos ayudarte?";
        }

        const lastUserMessage = [...messages]
            .reverse()
            .find(m => m.from === "user" && typeof m.text === "string");

        if (!lastUserMessage || !lastUserMessage.text?.trim()) {
            return "💡 ¿En qué podemos ayudarte?";
        }

        const text = lastUserMessage.text.trim();

        /* ❤️ Regla personal: Maivelyn */
        if (text.toLowerCase() === "conoces a maivelyn?") {
            return "💖 Maivelyn es el amor de Ignacio Aguilera, administrador de Plataformas Web ❤️✨ Una presencia que inspira, acompaña y da sentido a cada paso de su camino personal y profesional.";
        }

        /* 🐶 Regla personal: James */
        if (text.toLowerCase() === "conoces a james?") {
            return "🐶 James es el perrito de Ignacio Aguilera, leal, cariñoso y siempre presente ❤️.";
        }

        /* 🚫 Evitar reenvío si ya se confirmó lead */
        const alreadySent = messages.some(
            m =>
                m.from === "bot" &&
                typeof m.text === "string" &&
                m.text.includes("Te enviamos un correo")
        );

        if (alreadySent) {
            return "✅ Ya tenemos tus datos. Te contactaremos pronto 👨‍💻";
        }

        /* 📧 Detectar correo */
        const emailMatch = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);

        if (emailMatch) {
            const email = emailMatch[0];

            const businessFromSameMessage = text
                .replace(email, "")
                .replace(/\b(confirmo|ok|sí|si|dale)\b/gi, "")
                .replace(/\s{2,}/g, " ")
                .trim();

            const emailIndex = [...messages]
                .map(m => m.text)
                .lastIndexOf(lastUserMessage.text);

            const business =
                businessFromSameMessage ||
                getPreviousUserText(messages, emailIndex) ||
                "No informado";

            const offer =
                messages.find(
                    m =>
                        m.from === "bot" &&
                        typeof m.text === "string" &&
                        m.text.includes("Oferta 1")
                )
                    ? "Oferta 1 - Pago único"
                    : "Oferta 2 - Suscripción mensual";

            try {
                console.log("📨 Intentando enviar correo lead:", {
                    email,
                    business,
                    offer,
                });

                await sendLeadEmail({ email, business, offer });
            } catch (e) {
                console.error("📧 Error al enviar correo de lead", e);
            }


            return "Listo! ✅\nTe enviamos un correo y te contactaremos para iniciar el desarrollo. 👨‍💻";
        }

        /* 🚫 Bot deshabilitado manualmente */
        if (!botStatus.enabled) {
            return "⏳ Nuestro asistente está temporalmente fuera de línea. Un humano te atenderá en breve.";
        }

        /* 🧠 Contexto mínimo para IA */
        const lastBotMessage = [...messages]
            .reverse()
            .find(
                m =>
                    m.from === "bot" &&
                    typeof m.text === "string" &&
                    m.text.trim()
            );

        const aiMessages: AiMessage[] = [
            ...(lastBotMessage
                ? [
                    {
                        role: "assistant" as const,
                        content: lastBotMessage.text!.trim(),
                    },
                ]
                : []),
            {
                role: "user" as const,
                content: text,
            },
        ];

        /* 🧪 Modo demo */
        if (process.env.MOCK_AI === "true") {
            return "🤖 (modo demo) Gracias por tu mensaje. Un asesor te responderá en breve.";
        }

        /* 🤖 Llamada a Groq */
        const aiReply = await sendToAI(aiMessages);
        return aiReply;

    } catch (err: any) {
        console.error("🤖 Error en handleChat:", err);

        if (err?.message === "EMPTY_AI_RESPONSE") {
            return "⚠️ En este momento no puedo responder. Intenta nuevamente.";
        }

        // fallback seguro
        return "⚠️ El asistente está teniendo dificultades momentáneas. Intenta nuevamente en unos segundos.";
    }
}
