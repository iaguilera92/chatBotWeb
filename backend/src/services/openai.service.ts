import OpenAI from "openai";
import {
    PROMPT_NEGOCIO,
    PROMPT_PERFIL_IA,
    PROMPT_OFERTAS
} from "../prompts";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
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

    const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        max_tokens: 450,
        temperature: 0.5,
        messages: [
            { role: "system", content: systemPrompt },
            ...messages,
        ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content || !content.trim()) {
        throw new Error("EMPTY_AI_RESPONSE");
    }

    return content;
}
