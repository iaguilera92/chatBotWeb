import { ENV } from "../config/env";

export async function sendHumanMessage(to: string, text: string) {
    const res = await fetch(`${ENV.API_URL}/api/operator/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, text }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Error enviando mensaje humano");
    }

    return res.json();
}
