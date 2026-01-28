import Groq from "groq-sdk";
import {
    PROMPT_NEGOCIO,
    PROMPT_PERFIL_IA,
    PROMPT_OFERTAS,
} from "../prompts";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
});

export async function sendToAI(
    messages: { role: "user" | "assistant"; content: string }[],
    options?: {
        needsFullOfferDetail?: boolean;
    }
) {
    const baseSystemPrompt = `
${PROMPT_PERFIL_IA}
${PROMPT_NEGOCIO}
`.trim();

    const systemPrompt = options?.needsFullOfferDetail
        ? `${baseSystemPrompt}\n\n${PROMPT_OFERTAS}`
        : baseSystemPrompt;

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
