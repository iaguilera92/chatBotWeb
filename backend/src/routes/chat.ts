import { FastifyInstance, FastifyRequest } from "fastify";
import { sendToAI } from "../services/openai.service";

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

                // 🔹 Último mensaje del bot (para mantener el flujo)
                const lastBotMessage = [...messages]
                    .reverse()
                    .find(m => m.from === "bot" && typeof m.text === "string" && m.text.trim());

                // 🧠 Construcción mínima del contexto
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
