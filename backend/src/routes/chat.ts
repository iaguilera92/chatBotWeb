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
    sessionId: string;
    messages: UiMessage[];
    desdeSitioWeb?: boolean;
};


export async function chatRoutes(app: FastifyInstance) {
    app.post(
        "/api/chat",
        async (request: FastifyRequest<{ Body: ChatBody }>, reply) => {
            try {
                const { sessionId, messages, desdeSitioWeb } = request.body;

                const result = await handleChat(sessionId, messages, desdeSitioWeb);

                return {
                    phase: result.phase,
                    replies: [{ text: result.text, phase: result.phase }],
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
