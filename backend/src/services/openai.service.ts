import OpenAI from "openai";
import {
    PROMPT_NEGOCIO,
    PROMPT_PERFIL_IA,
    PROMPT_OFERTAS
} from "../prompts";


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export async function sendToAI(messages: {
    role: "user" | "assistant";
    content: string;
}[]) {

    const systemPrompt = `
${PROMPT_PERFIL_IA}

${PROMPT_NEGOCIO}

${PROMPT_OFERTAS}
  `.trim();

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: systemPrompt },
            ...messages,
        ],
    });

    return response.choices[0].message.content;
}
