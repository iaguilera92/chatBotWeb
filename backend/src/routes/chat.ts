import { FastifyInstance, FastifyRequest } from "fastify";
import { handleChat } from "../services/chat.handler";


type UiMessage = {
    from: "user" | "bot";
    text?: string | null;
    image?: string;
    video?: string;
    status?: "sent" | "delivered" | "seen";
    timestamp?: string | Date;
};

type ChatBody = {
    messages: UiMessage[];
};


export async function chatRoutes(app: FastifyInstance) {
    app.post(
        "/api/chat",
        async (request: FastifyRequest<{ Body: ChatBody }>, reply) => {
            try {
                const { messages } = request.body;

                const text = await handleChat(messages);

                return {
                    replies: [{ text }],
                };

            } catch (error) {
                app.log.error(error);
                reply.code(500);
                return {
                    replies: [
                        {
                            text: "⚠️ En este momento no puedo responder. Intenta nuevamente en unos segundos 😊",
                        },
                    ],
                };
            }
        }
    );
}
