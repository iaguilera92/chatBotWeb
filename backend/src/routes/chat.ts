import { FastifyInstance, FastifyRequest } from "fastify";
import { sendToAI } from "../services/openai.service";
import { sendLeadEmail } from "../services/email.service";
import { notifyAdminBotDown } from "../services/notifyAdminBotDown";
import { botStatus } from "../state/botStatus";

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

                // ❤️ REGLA PERSONAL: Maivelyn
                if (text.toLowerCase() === "conoces a maivelyn?") {
                    return {
                        reply: {
                            text: "💖 Maivelyn es el amor de Ignacio Aguilera, administrador de Plataformas Web ❤️✨ Una presencia que inspira, acompaña y da sentido a cada paso de su camino personal y profesional.",
                            image: "/fondo_adm.jpeg",
                        },
                    };
                }

                // 🎬 REGLA PERSONAL: James
                if (text.toLowerCase() === "conoces a james?") {
                    return {
                        reply: {
                            text: "🐶 James es el perrito de Ignacio Aguilera el Adminsitrador... Es Leal, cariñoso y siempre presente, un verdadero compañero de vida y bastante MAMON ❤️.",
                            video: "/james.mp4",
                        },
                    };
                }

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

                app.log.warn({ botStatus }, "ESTADO ACTUAL DEL BOT");

                // 🚫 BOT CAÍDO → NO llamar a OpenAI
                if (!botStatus.enabled) {
                    return reply.status(204).send();
                }

                // 🤖 Llamada a la IA
                try {
                    const aiReply = await sendToAI(aiMessages);
                    return { reply: aiReply };
                } catch (err: any) {

                    app.log.error(
                        {
                            status: err?.status,
                            statusCode: err?.statusCode,
                            code: err?.code,
                            name: err?.name,
                            message: err?.message,
                            error: err?.error,
                        },
                        "ERROR DESDE OPENAI"
                    );


                    if (err.message === "EMPTY_AI_RESPONSE") {
                        app.log.error("La IA respondió vacío");
                        return {
                            reply: "⚠️ En este momento no puedo responder. Intenta nuevamente.",
                        };
                    }


                    // 🚨 CASO CLAVE: OpenAI sin saldo / límite
                    const status = err?.status ?? err?.statusCode;

                    // 🚨 CASO CLAVE: OpenAI sin saldo / límite
                    if (status === 402 || status === 429) {

                        if (botStatus.enabled) {
                            botStatus.enabled = false;
                            botStatus.disabledAt = new Date();
                            botStatus.reason = "openai_quota_exceeded";

                            const rawMessage = err?.message || "";
                            const retryMatch = rawMessage.match(/try again in ([\dhms\.]+)/i);

                            let retryAfter: string | null = null;

                            if (retryMatch) {
                                const raw = retryMatch[1];

                                const h = raw.match(/(\d+)h/)?.[1];
                                const m = raw.match(/(\d+)m/)?.[1];

                                if (h || m) {
                                    retryAfter = `${h ? `${h}h` : ""}${h && m ? " " : ""}${m ? `${m}m` : ""}`;
                                }
                            }


                            await notifyAdminBotDown({
                                reason: botStatus.reason,
                                disabledAt: botStatus.disabledAt,
                                retryAfter,
                            });
                        }

                        return reply.status(204).send();
                    }


                    // ❗ Otros errores siguen el flujo normal
                    throw err;
                }

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
