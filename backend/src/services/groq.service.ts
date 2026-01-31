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

export async function sendToAI(
    messages: AiMessage[],
    options?: {
        needsFullOfferDetail?: boolean;
        intent?: IntentContext;
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
CONTEXTO DE CONVERSACIÓN:
El usuario ha salido del flujo comercial.

INSTRUCCIONES:
- Responde libremente usando SOLO la información de los prompts del sistema.
- NO ofrezcas ofertas.
- NO muestres precios.
- NO hagas preguntas comerciales.
- NO intentes retomar el flujo.
- Mantén un tono natural y profesional.
`
            : `
CONTEXTO DE CONVERSACIÓN:
El usuario sigue dentro del flujo comercial.

INSTRUCCIONES:
- Respeta estrictamente el flujo definido por el sistema.
`;

    const systemPrompt = `
${baseSystemPrompt}
${offerRules}
${intentRules}
`.trim();

    const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
        top_p: 0.9,
        max_tokens: options?.needsFullOfferDetail ? 450 : 150,
        messages: [
            { role: "system", content: systemPrompt },
            ...messages,
        ],
    });

    const content = response.choices[0]?.message?.content;

    if (!content || !content.trim()) {
        throw new Error("EMPTY_AI_RESPONSE");
    }

    return content.trim();
}
