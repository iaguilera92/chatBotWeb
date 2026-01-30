import { sendToAI } from "./groq.service";
import { sendLeadEmail } from "./email.service";
import { botStatus } from "../state/botStatus";

// Tipos reutilizados

export type UiMessage = {
    from: "user" | "bot";
    text?: string | null;
    image?: string;
    video?: string;
    status?: "sent" | "delivered" | "seen";
    timestamp?: string | Date;
};

type AiMessage = {
    role: "user" | "assistant";
    content: string;
};

// Utils

function getPreviousUserText(
    messages: UiMessage[],
    beforeIndex: number
): string | null {
    for (let i = beforeIndex - 1; i >= 0; i--) {
        const m = messages[i];
        if (m.from === "user" && typeof m.text === "string") {
            return m.text.trim();
        }
    }
    return null;
}

// HANDLER PRINCIPAL

export async function handleChat(messages: UiMessage[]): Promise<string> {
    try {
        /* 🟢 Validación base */
        if (!messages || messages.length === 0) {
            return "💡 ¿En qué podemos ayudarte?";
        }

        const lastUserMessage = [...messages]
            .reverse()
            .find(m => m.from === "user" && typeof m.text === "string");

        if (!lastUserMessage || !lastUserMessage.text?.trim()) {
            return "💡 ¿En qué podemos ayudarte?";
        }

        const text = lastUserMessage.text.trim();

        /* 👋 1) SALUDO EXACTO */
        const isGreeting = /^(hola|buenas|hey|holi|hello)$/i.test(text);

        if (isGreeting) {
            return "Hola 🙋‍♂️\n¿Te gustaría ver las ofertas de hoy?";
        }

        /* ✅ 2) RESPUESTA AFIRMATIVA → LISTADO DE OFERTAS (HARDCODED) */
        const isAffirmative = /\b(si|sí|ok|dale|claro)\b/i.test(text);

        if (isAffirmative) {
            return `*Oferta 1: Pago único*
💰 Reserva inicial: $29.990 CLP
💵 Pago final: $70.000 CLP
🧾 Inversión total: $99.990 CLP
⏱️ Tiempo de desarrollo: 3 a 7 días

*Oferta 2: Suscripción mensual*
🚀 Desarrollo inicial: $29.990 CLP
📆 Suscripción mensual: $9.990 CLP
⚡ Tiempo de desarrollo: 72 hrs

¿Cuál oferta te interesa más? 😊`;

        }

        /* 🎯 3) SELECCIÓN DE OFERTA → DETALLE (HARDCODED) */
        const isOffer1 = /\b(oferta|opción|opcion|la)\s*1\b/i.test(text);
        const isOffer2 = /\b(oferta|opción|opcion|la)\s*2\b/i.test(text);

        if (isOffer1) {
            return `DETALLE – *Oferta 1: Pago único*

🟢 *Precios (2 cuotas)*
Reserva inicial: $29.990 CLP
Pago final al entregar el sitio: $70.000 CLP

⏰ *Plazo de desarrollo*
Entre 3 y 7 días, según complejidad y contenido.

📦 *Incluye*
- Desarrollo completo de sitio web profesional.
- Diseño moderno y 100% responsivo.
- Hosting seguro incluido.
- Sitio web administrable con acceso seguro.
- Entrega final del sitio listo para publicar.
- Capacitación básica para administrar el sitio.

📑 *Secciones incluidas*
- Inicio
- Datos del negocio
- Servicios / precios
- Contadores
- Evidencias / trabajos
- Ubicación (mapa)
- Contacto (formulario validado)
- Integración WhatsApp y correo
- Nosotros
- Menú responsivo
- Footer
- Panel de administración estándar

🧾 *Inversión total: $99.990 CLP*

📌 *Importante*
- Cambios posteriores se cotizan según requerimiento.

*¿Confirmas esta opción?* 👨‍💻`;
        }

        if (isOffer2) {
            return `DETALLE – *Oferta 2: Suscripción mensual*

🟢 *Precios*
Desarrollo inicial: $29.990 CLP
Suscripción mensual: $9.990 CLP

⏰ *Plazo de desarrollo*
72 horas desde la entrega del contenido.

📦 *Incluye*
- Desarrollo completo de sitio web profesional.
- Diseño moderno y 100% responsivo.
- Hosting seguro incluido.
- Sitio web administrable con acceso seguro.
- Soporte técnico 24/7.
- Cambios y mejoras continuas.
- Acompañamiento permanente: nos encargamos de tu web.

📑 *Secciones incluidas*
- Inicio
- Datos del negocio
- Servicios / precios
- Contadores
- Evidencias / trabajos
- Ubicación (mapa)
- Contacto (formulario validado)
- Integración WhatsApp y correo
- Nosotros
- Menú responsivo
- Footer
- Panel de administración estándar

*¿Confirmas esta opción?* 👨‍💻`;
        }

        /* ✅ CONFIRMACIÓN DE OFERTA → PEDIR DATOS (EXACTO) */
        const isConfirmation =
            /\b(confirmo|confirmar|sí confirmo|si confirmo|ok confirmo|dale confirmo)\b/i.test(text);

        if (isConfirmation) {
            return `Perfecto 😊 para continuar, por favor indícame:
1) Tu correo electrónico
2) Nombre del negocio o emprendimiento`;
        }

        /* 🚫 Validación: si menciona otra oferta */
        const mentionsOtherOffer = /\b(oferta|opción|opcion)\s*\d+\b/i.test(text) && !isOffer1 && !isOffer2;
        if (mentionsOtherOffer) {
            return "⚠️ No contamos con esa oferta. Actualmente solo tenemos la *Oferta 1* y la *Oferta 2*.";
        }

        /* ❤️ Regla personal: Maivelyn */
        if (text.toLowerCase() === "conoces a maivelyn?") {
            return "💖 Maivelyn es el amor de Ignacio Aguilera, administrador de Plataformas Web ❤️✨ Una presencia que inspira, acompaña y da sentido a cada paso de su camino personal y profesional.";
        }

        /* 🐶 Regla personal: James */
        if (text.toLowerCase() === "conoces a james?") {
            return "🐶 James es el perrito de Ignacio Aguilera, leal, cariñoso y siempre presente ❤️.";
        }

        /* 🚫 Evitar reenvío si ya se confirmó lead */
        const lastMessageWasLeadConfirmation =
            lastUserMessage.text?.includes("@") &&
            messages.some(
                m =>
                    m.from === "bot" &&
                    typeof m.text === "string" &&
                    m.text.includes("Te enviamos un correo")
            );

        if (lastMessageWasLeadConfirmation) {
            return "✅ Ya tenemos tus datos. Te contactaremos pronto 👨‍💻";
        }

        const leadAlreadySent = messages.some(
            m =>
                m.from === "bot" &&
                typeof m.text === "string" &&
                m.text.includes("Te enviamos un correo")
        );

        /* 📧 Detectar correo */
        const emailMatch = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);

        if (emailMatch) {
            if (leadAlreadySent) {
                return "✅ Ya tenemos tus datos. Te contactaremos pronto 👨‍💻";
            }
            const email = emailMatch[0];

            const businessFromSameMessage = text
                .replace(email, "")
                .replace(/\b(confirmo|ok|sí|si|dale)\b/gi, "")
                .replace(/\s{2,}/g, " ")
                .trim();

            const emailIndex = [...messages]
                .map(m => m.text)
                .lastIndexOf(lastUserMessage.text);

            const business =
                businessFromSameMessage ||
                getPreviousUserText(messages, emailIndex) ||
                "No informado";

            const offer =
                messages.find(
                    m =>
                        m.from === "bot" &&
                        typeof m.text === "string" &&
                        m.text.includes("Oferta 1")
                )
                    ? "Oferta 1 - Pago único"
                    : "Oferta 2 - Suscripción mensual";

            try {
                console.log("🚨 Llamando a sendLeadEmail()");
                await sendLeadEmail({ email, business, offer });

                return "Listo! ✅\nTe enviamos un correo y te contactaremos para iniciar el desarrollo. 👨‍💻";
            } catch (e) {
                console.error("📧 Error al enviar correo de lead", e);

                return "Listo! ✅\nRecibimos tus datos y te contactaremos pronto por WhatsApp o correo. 👨‍💻";
            }
        }

        /* 🚫 Bot deshabilitado manualmente */
        if (!botStatus.enabled) {
            return "⏳ Nuestro asistente está temporalmente fuera de línea. Un humano te atenderá en breve.";
        }

        /* 🧠 Contexto mínimo para IA */
        const lastBotMessage = [...messages]
            .reverse()
            .find(
                m =>
                    m.from === "bot" &&
                    typeof m.text === "string" &&
                    m.text.trim()
            );

        const aiMessages: AiMessage[] = [
            ...(lastBotMessage
                ? [
                    {
                        role: "assistant" as const,
                        content: lastBotMessage.text!.trim(),
                    },
                ]
                : []),
            {
                role: "user" as const,
                content: text,
            },
        ];

        /* 🧪 Modo demo */
        if (process.env.MOCK_AI === "true") {
            return "🤖 (modo demo) Gracias por tu mensaje. Un asesor te responderá en breve.";
        }

        /* 🤖 Llamada a Groq */
        const aiReply = await sendToAI(aiMessages);
        return aiReply;

    } catch (err: any) {
        console.error("🤖 Error en handleChat:", err);

        if (err?.message === "EMPTY_AI_RESPONSE") {
            return "⚠️ En este momento no puedo responder. Intenta nuevamente.";
        }

        // fallback seguro
        return "⚠️ El asistente está teniendo dificultades momentáneas. Intenta nuevamente en unos segundos.";
    }
}
