import Groq from "groq-sdk";
import {
    PROMPT_NEGOCIO,
    PROMPT_PERFIL_IA,
    PROMPT_OFERTAS,
} from "../prompts";

export type AiRole = "user" | "assistant";

export type AiMessage = {
    role: AiRole;
    content: string;
};

export type IntentContext = "in_flow" | "out_of_flow";


const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
});

const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

export async function sendToAI(
    messages: AiMessage[],
    options?: {
        needsFullOfferDetail?: boolean;
        intent?: IntentContext;
        stream?: boolean;
    }
) {
    const baseSystemPrompt = `
${PROMPT_PERFIL_IA}
${PROMPT_NEGOCIO}
`.trim();

    const offerRules = options?.needsFullOfferDetail
        ? `\n\n${PROMPT_OFERTAS}`
        : "";

    const intentRules =
        options?.intent === "out_of_flow"
            ? `
Fuera de flujo: responde solo con la info del sistema.
No ofrezcas ofertas ni precios, no hagas preguntas comerciales.
No retomes el flujo (el sistema lo hará). Tono natural y profesional.
`
            : `
Dentro de flujo: respeta estrictamente el flujo definido por el sistema.
`;

    const systemPrompt = `
${baseSystemPrompt}
${offerRules}
${intentRules}
`.trim();

    const start = Date.now();

    if (options?.stream) {
        const stream = await groq.chat.completions.create({
            model: DEFAULT_MODEL,
            temperature: 0.3,
            top_p: 0.9,
            max_tokens: options?.needsFullOfferDetail ? 300 : 120,
            stream: true,
            messages: [
                { role: "system", content: systemPrompt },
                ...messages,
            ],
        });

        let content = "";
        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) content += delta;
        }

        const ms = Date.now() - start;
        console.log(`[AI] Groq latency: ${ms}ms (streamed)`);

        if (!content || !content.trim()) {
            throw new Error("EMPTY_AI_RESPONSE");
        }

        return content.trim();
    }

    const response = await groq.chat.completions.create({
        model: DEFAULT_MODEL,
        temperature: 0.3,
        top_p: 0.9,
        max_tokens: options?.needsFullOfferDetail ? 300 : 120,
        messages: [
            { role: "system", content: systemPrompt },
            ...messages,
        ],
    });

    const ms = Date.now() - start;
    console.log(`[AI] Groq latency: ${ms}ms`);

    const content = response.choices[0]?.message?.content;

    if (!content || !content.trim()) {
        throw new Error("EMPTY_AI_RESPONSE");
    }

    return content.trim();
}

