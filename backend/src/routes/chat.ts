import { FastifyInstance, FastifyRequest } from "fastify";
import { sendToAI } from "../services/openai.service";
import { sendLeadEmail } from "../services/email.service";

type UiMessage = {
    from: "user" | "bot";
    text: string | null;
    status?: "sent" | "delivered" | "seen";
    timestamp?: string | Date;
};

type ChatBody = {
    messages: UiMessage[];
};

type AiMessage = {
    role: "user" | "assistant";
    content: string;
};

// 🔎 Obtiene el texto del usuario anterior a cierto índice
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

export async function chatRoutes(app: FastifyInstance) {
    app.post(
        "/api/chat",
        async (request: FastifyRequest<{ Body: ChatBody }>, reply) => {
            try {
                const { messages } = request.body;

                app.log.info(
                    {
                        messages: messages.map(m => ({
                            from: m.from,
                            text: m.text,
                        })),
                    },
                    "RAW UI MESSAGES"
                );

                if (!messages || messages.length === 0) {
                    return { reply: "💡 ¿En qué podemos ayudarte?" };
                }

                // 🔹 Último mensaje del usuario
                const lastUserMessage = [...messages]
                    .reverse()
                    .find(m => m.from === "user" && typeof m.text === "string");

                if (!lastUserMessage || !lastUserMessage.text?.trim()) {
                    return { reply: "💡 ¿En qué podemos ayudarte?" };
                }

                const text = lastUserMessage.text.trim();

                // 🚫 Evitar reenvío si ya se confirmó
                const alreadySent = messages.some(
                    m =>
                        m.from === "bot" &&
                        typeof m.text === "string" &&
                        m.text.includes("Te enviamos un correo")
                );

                if (alreadySent) {
                    return {
                        reply: "✅ Ya tenemos tus datos. Te contactaremos pronto 👨‍💻",
                    };
                }

                // 📧 Detectar correo dentro del texto
                const emailMatch = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);

                if (emailMatch) {
                    const email = emailMatch[0];

                    // 🏷️ Extraer nombre del negocio desde el mismo mensaje
                    const businessFromSameMessage = text
                        .replace(email, "")
                        .replace(/\b(confirmo|ok|sí|si|dale)\b/gi, "")
                        .replace(/\s{2,}/g, " ")
                        .trim();

                    // 🏷️ Fallback: mensaje anterior
                    const emailIndex = [...messages]
                        .map(m => m.text)
                        .lastIndexOf(lastUserMessage.text);

                    const business =
                        businessFromSameMessage ||
                        getPreviousUserText(messages, emailIndex) ||
                        "No informado";

                    // 📦 Determinar oferta (simple)
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
                        await sendLeadEmail({
                            email,
                            business,
                            offer,
                        });

                        app.log.info(
                            { email, business, offer },
                            "Correo enviado correctamente"
                        );
                    } catch (e) {
                        app.log.error(
                            { error: e, email, business, offer },
                            "Error al enviar Correo"
                        );
                    }

                    return {
                        reply:
                            "Listo! ✅\nTe enviamos un correo y te contactaremos para iniciar el desarrollo. 👨‍💻",
                    };
                }

                // 🔹 Último mensaje del bot (contexto mínimo)
                const lastBotMessage = [...messages]
                    .reverse()
                    .find(
                        m =>
                            m.from === "bot" &&
                            typeof m.text === "string" &&
                            m.text.trim()
                    );

                // 🧠 Contexto mínimo para IA (rápido)
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
                        content: lastUserMessage.text.trim(),
                    },
                ];

                // 🤖 Llamada a la IA
                const aiReply = await sendToAI(aiMessages);

                return {
                    reply: aiReply || "💡 ¿En qué podemos ayudarte?",
                };
            } catch (error) {
                app.log.error(error);
                reply.code(500);
                return {
                    reply:
                        "⚠️ En este momento no puedo responder. Intenta nuevamente en unos segundos 😊",
                };
            }
        }
    );
}
