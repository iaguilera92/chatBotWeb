import { sendToAI } from "./openai.service";
import { sendLeadEmail } from "./email.service";
import { notifyAdminBotDown } from "./notifyAdminBotDown";
import { botStatus } from "../state/botStatus";

/* =======================
   Tipos reutilizados
======================= */

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

/* =======================
   Utils (copiado tal cual)
======================= */

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

/* =======================
   HANDLER ÚNICO DEL CHAT
======================= */

export async function handleChat(messages: UiMessage[]): Promise<string> {
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

    /* ❤️ REGLA PERSONAL: Maivelyn */
    if (text.toLowerCase() === "conoces a maivelyn?") {
        return "💖 Maivelyn es el amor de Ignacio Aguilera, administrador de Plataformas Web ❤️✨ Una presencia que inspira, acompaña y da sentido a cada paso de su camino personal y profesional.";
    }

    /* 🎬 REGLA PERSONAL: James */
    if (text.toLowerCase() === "conoces a james?") {
        return "🐶 James es el perrito de Ignacio Aguilera, leal, cariñoso y siempre presente ❤️.";
    }

    /* 🚫 Evitar reenvío si ya se confirmó */
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
            await sendLeadEmail({ email, business, offer });
        } catch (e) {
            console.error("Error al enviar correo", e);
        }

        return "Listo! ✅\nTe enviamos un correo y te contactaremos para iniciar el desarrollo. 👨‍💻";
    }

    /* 🧠 Último mensaje del bot */
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



    /* 🚫 Bot deshabilitado */
    if (!botStatus.enabled) {
        return "";
    }

    /* 🤖 Llamada IA */
    try {
        const aiReply = await sendToAI(aiMessages);
        return aiReply;
    } catch (err: any) {
        if (err?.message === "EMPTY_AI_RESPONSE") {
            return "⚠️ En este momento no puedo responder. Intenta nuevamente.";
        }

        const status = err?.status ?? err?.statusCode;

        if (status === 402 || status === 429) {
            if (botStatus.enabled) {
                botStatus.enabled = false;
                botStatus.disabledAt = new Date();
                botStatus.reason = "openai_quota_exceeded";

                await notifyAdminBotDown({
                    reason: botStatus.reason,
                    disabledAt: botStatus.disabledAt,
                    retryAfter: null,
                });
            }
            return "";
        }

        throw err;
    }
}
