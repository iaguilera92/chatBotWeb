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

        // 🔴 ÚLTIMO CHAT BOT
        const lastBotMessage =
            [...messages]
                .reverse()
                .find(m => m.from === "bot" && typeof m.text === "string")
                ?.text ?? "";

        // FASE
        const phase =
            lastBotMessage.includes("¿Te gustaría ver las ofertas")
                ? "waiting_offer_intro"
                : lastBotMessage.includes("¿Cuál oferta te interesa")
                    ? "waiting_offer_selection"
                    : lastBotMessage.includes("¿Confirmas esta opción")
                        ? "waiting_confirmation"
                        : lastBotMessage.includes("Tu correo electrónico")
                            ? "waiting_lead"
                            : lastBotMessage.includes("Te enviamos un correo")
                                ? "lead_sent"
                                : "idle";


        /* 🔁 REENVÍO DE CORREO (PRIORIDAD MÁXIMA) */
        const wantsResend =
            /reenvi|enviame de nuevo|envíame de nuevo|no me llegó|mandalo otra vez/i.test(text);

        if (wantsResend) {
            if (!botStatus.leadEmailSent || !botStatus.leadEmail) {
                return "⚠️ Aún no tenemos un correo registrado para reenviar.";
            }

            await sendLeadEmail({
                email: botStatus.leadEmail,
                business: "Registrado previamente",
                offer: botStatus.leadOffer ?? "Oferta registrada",
                registeredAt: botStatus.leadRegisteredAt ?? undefined,
            });

            return `Perfecto 👍 reenviaré el correo con la información de tu negocio.
Si tienes cualquier problema, avísame.`;
        }



        /* 👋 1) SALUDO EXACTO */
        const isGreeting = /^(hola|buenas|hey|holi|hello)$/i.test(text);

        if (isGreeting && phase === "idle") {
            return "Hola 🙋‍♂️\n¿Te gustaría ver las ofertas de hoy?";
        }

        if (isGreeting && phase !== "idle") {
            return "😊 Sigamos donde quedamos.";
        }

        if (phase === "lead_sent") {
            return "✅ Ya tenemos tus datos. Te contactaremos pronto 👨‍💻";
        }

        /* ✅ 2) RESPUESTA AFIRMATIVA → LISTADO DE OFERTAS (HARDCODED) */
        const isAffirmative =
            /\b(si|sí|ok|dale|claro|bueno|ya|perfecto)\b/i.test(text);



        if (isAffirmative && phase === "waiting_offer_intro") {

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
        const isOffer1 =
            phase === "waiting_offer_selection" &&
            /^(1|la\s*1|oferta\s*1|opción\s*1|opcion\s*1)$/i.test(text);

        const isOffer2 =
            phase === "waiting_offer_selection" &&
            /^(2|la\s*2|oferta\s*2|opción\s*2|opcion\s*2)$/i.test(text);



        if (
            phase === "waiting_offer_selection" &&
            /^\D*\d+\D*$/.test(text) &&
            !isOffer1 &&
            !isOffer2
        ) {
            return "👉 Indícame la opción escribiendo *1* o *2*, por favor 😊";
        }



        if (isOffer1 && phase === "waiting_offer_selection") {
            botStatus.leadOffer = "Oferta 1 - Pago único";

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

        if (isOffer2 && phase === "waiting_offer_selection") {
            botStatus.leadOffer = "Oferta 2 - Suscripción mensual";

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

        /* ✅ CONFIRMACIÓN */
        if (phase === "waiting_confirmation" &&
            /\b(confirmo|confirmar|sí|si|ok|dale)\b/i.test(text)
        ) {

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

        /* 📧 Detectar correo */
        /* 📧 ESPERA EMAIL + NEGOCIO */
        if (phase === "waiting_lead") {

            // ✅ OPCIONAL 1: solo email (sin negocio)
            const onlyEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
            if (onlyEmail) {
                return `Perfecto 👍 ahora indícame el *nombre del negocio o emprendimiento*`;
            }

            // 🧾 Email + negocio en un solo mensaje
            const match = text.match(/^([^\s@]+@[^\s@]+\.[^\s@]+)\s+(.+)$/);

            if (!match) {
                return `⚠️ Formato incorrecto.
Por favor envíame:
1) Tu correo electrónico
2) Nombre del negocio

Ejemplo:
correo@dominio.cl Mi Negocio`;
            }

            const email = match[1];
            const business = match[2];

            const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

            if (!isValidEmail) {
                return `⚠️ El correo ingresado no es válido.
Ejemplo:
correo@dominio.cl Mi Negocio`;
            }

            try {
                await sendLeadEmail({
                    email,
                    business,
                    offer: botStatus.leadOffer ?? "Oferta no especificada",
                });

                botStatus.leadEmailSent = true;
                botStatus.leadEmail = email;
                botStatus.leadRegisteredAt = new Date();
                botStatus.phase = "lead_sent"; // 👈 opcional 2 (ya lo hiciste)

                return "Listo! ✅📧 Te enviamos un correo y te contactaremos 👨‍💻";

            } catch (e) {
                console.error("📧 Error al enviar correo", e);
                return "⚠️ Hubo un problema al registrar tus datos. Intenta nuevamente.";
            }
        }

        /* 🚫 Bot deshabilitado manualmente */
        if (!botStatus.enabled) {
            return "⏳ Nuestro asistente está temporalmente fuera de línea. Un humano te atenderá en breve.";
        }

        /* 🚨 BLOQUE ANTI-NÚMEROS SUELTOS (AQUÍ) */
        if (
            /^\d+$/.test(text) &&
            phase !== "waiting_offer_selection"
        ) {
            return "🤔 ¿Podrías indicarme un poco más de detalle?";
        }

        if (process.env.MOCK_AI === "true") {
            return "🤖 (modo demo) Gracias por tu mensaje.";
        }

        return await sendToAI([
            {
                role: "assistant",
                content: "Eres un asistente comercial. No repitas ofertas si ya fueron mostradas."
            },
            {
                role: "user",
                content: text
            }
        ]);

    } catch (err: any) {
        console.error("🤖 Error en handleChat:", err);

        if (err?.message === "EMPTY_AI_RESPONSE") {
            return "⚠️ En este momento no puedo responder. Intenta nuevamente.";
        }

        // fallback seguro
        return "⚠️ El asistente está teniendo dificultades momentáneas. Intenta nuevamente en unos segundos.";
    }
}
