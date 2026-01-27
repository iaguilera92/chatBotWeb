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
    extraSystemPrompt?: string
) {
    const baseSystemPrompt = `
${PROMPT_PERFIL_IA}
${PROMPT_NEGOCIO}
${PROMPT_OFERTAS}
`.trim();

    const systemPrompt = extraSystemPrompt
        ? `${baseSystemPrompt}\n\n${extraSystemPrompt}`
        : baseSystemPrompt;

    const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        temperature: 0.4,
        max_tokens: 400,
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
