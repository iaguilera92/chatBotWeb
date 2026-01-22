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
                console.log("RAW MESSAGES >>>", messages);

                // ✅ Sanitizar + convertir al formato OpenAI
                const cleanMessages =
                    messages.length > 0 && messages[0].from === "bot"
                        ? messages.slice(1)
                        : messages;

                const aiMessages: AiMessage[] = cleanMessages
                    .filter((m): m is UiMessage & { text: string } => typeof m.text === "string")
                    .map<AiMessage>((m) => ({
                        role: m.from === "user" ? "user" : "assistant",
                        content: m.text.trim(),
                    }))
                    .filter((m) => m.content.length > 0);


                // 🔍 Seguridad extra
                if (aiMessages.length === 0) {
                    return { reply: "💡 ¿En qué podemos ayudarte?" };
                }

                // 🤖 LLAMADA REAL A LA IA
                const aiReply = await sendToAI(aiMessages);

                // ✅ RESPUESTA AL FRONTEND
                return { reply: aiReply };

            } catch (error) {
                app.log.error(error);
                reply.code(500);
                return { error: "Error IA" };
            }
        }
    );
}
