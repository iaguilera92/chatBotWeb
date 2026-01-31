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

export type AiRole = "system" | "user" | "assistant";

export type AiMessage = {
    role: AiRole;
    content: string;
};

function isFlowBreaking(text: string) {
    return !(
        /^(si|sí|no|ok|dale|1|2|confirmo|confirmar)$/i.test(text) ||
        /^[^\s@]+@[^\s@]+\.[^\s@]+/.test(text)
    );
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

        const rawText = lastUserMessage.text;
        const text = rawText
            .replace(/\u00A0/g, " ") // NBSP → espacio normal
            .trim()
            .toLowerCase();

        // 🔴 ÚLTIMO CHAT BOT
        const lastBotMessage =
            [...messages]
                .reverse()
                .find(m => m.from === "bot" && typeof m.text === "string")
                ?.text ?? "";

        const PHRASES = {
            OFFER_INTRO: "¿Te gustaría ver las ofertas",
            OFFER_SELECTION: "¿Cuál oferta te interesa",
            CONFIRMATION: "¿Confirmas esta opción",
            LEAD_REQUEST: "Tu correo electrónico",
            LEAD_SENT: "Te enviamos un correo",
        };

        // FASE
        const phase =
            lastBotMessage.includes(PHRASES.OFFER_INTRO)
                ? "waiting_offer_intro"
                : lastBotMessage.includes(PHRASES.OFFER_SELECTION)
                    ? "waiting_offer_selection"
                    : lastBotMessage.includes(PHRASES.CONFIRMATION)
                        ? "waiting_confirmation"
                        : lastBotMessage.includes(PHRASES.LEAD_REQUEST)
                            ? "waiting_lead"
                            : lastBotMessage.includes(PHRASES.LEAD_SENT)
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

        /* ⏸️ USUARIO PIDE ESPERA */
        if (
            /\b(wait|espera|espérame|esperame|un segundo|un momento|dame un segundo)\b/i.test(text) ||
            /^[\p{Emoji}\s]+$/u.test(text)
        ) {
            return "Perfecto 👍, lo esperamos ⏸️";
        }

        /* 👋 1) SALUDO EXACTO */
        const isGreeting = /^(hola|buenas|hey|holi|hello)$/i.test(text);

        if (isGreeting && phase === "idle") {
            botStatus.phase = "waiting_offer_intro"; // 👈 CLAVE
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
            botStatus.leadErrors = 0;
            botStatus.phase = "waiting_offer_selection";
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
        const normalized = text.replace(/\s+/g, " ");
        const isOffer1 =
            phase === "waiting_offer_selection" &&
            ["1", "la 1", "oferta 1", "opcion 1", "opción 1"].includes(normalized);

        const isOffer2 =
            phase === "waiting_offer_selection" &&
            ["2", "la 2", "oferta 2", "opcion 2", "opción 2"].includes(normalized);

        if (
            phase === "waiting_offer_selection" &&
            /\b(ok|ya|mmm|mm|vale|entiendo)\b/i.test(text)
        ) {
            return "😊 Perfecto.\nIndícame qué opción prefieres escribiendo *1* o *2*.";
        }

        /* 🚫 MENCIÓN INCOMPLETA DE OFERTA */
        if (
            phase === "waiting_offer_selection" &&
            /\boferta\b/i.test(text) &&
            !/\d/.test(text)
        ) {
            return "🙂 Tenemos dos opciones disponibles.\nIndícame *1* o *2* para continuar.";
        }

        /* 🚫 OFERTA CON NÚMERO INVÁLIDO */
        if (
            phase === "waiting_offer_selection" &&
            /\b(oferta|opción|opcion)\s*\d+\b/i.test(text) &&
            !isOffer1 &&
            !isOffer2
        ) {
            return "⚠️ Actualmente solo contamos con *Oferta 1* y *Oferta 2*.\nIndícame cuál te interesa 😊";
        }

        /* 🚫 NÚMERO SUELTO */
        if (
            phase === "waiting_offer_selection" &&
            /^\D*\d+\D*$/.test(text) &&
            !isOffer1 &&
            !isOffer2
        ) {
            return "🤔 Elige una opción válida escribiendo *1* o *2*, por favor 😊";
        }



        if (isOffer1 && phase === "waiting_offer_selection") {
            botStatus.phase = "waiting_confirmation";
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
            botStatus.phase = "waiting_confirmation";
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

        /* 🚫 CONFIRMACIÓN SIN OFERTA */
        if (
            phase === "waiting_offer_selection" &&
            /\b(confirmo|confirmar|sí|si|ok|dale)\b/i.test(text)
        ) {
            return "🙂 Primero necesito saber qué oferta te interesa.\nIndícame *1* o *2*, por favor.";
        }

        /* ✅ CONFIRMACIÓN */
        if (
            phase === "waiting_confirmation" &&
            botStatus.leadOffer &&
            /\b(confirmo|confirmar|sí|si|ok|dale)\b/i.test(text)
        ) {
            botStatus.phase = "waiting_lead";
            return `Perfecto 😊 para continuar, por favor indícame:
1) Tu correo electrónico
2) Nombre del negocio o emprendimiento`;
        }

        /* ❤️ Regla personal: Maivelyn */
        if (text.toLowerCase() === "conoces a maivelyn?") {
            return "💖 Maivelyn es el amor de Ignacio Aguilera, administrador de Plataformas Web ❤️✨ Una presencia que inspira, acompaña y da sentido a cada paso de su camino personal y profesional.";
        }

        /* 🚫 Regla anti-insultos */
        const insults = [
            "pete", "petardo",
            "idiota", "imbécil", "imbecil", "imbesil",
            "tonto", "tonta", "tontos", "tontas",
            "weon", "weona", "weón", "weona", "hueon", "hueona", "hueón", "hueona",
            "tarado", "tarada",
            "estúpido", "estupido", "estúpida", "estupida",
            "payaso", "payasa",
            "pelotudo", "pelotuda",
            "gil", "gilazo",
            "pajero", "pajera",
            "imbecil", "leso", "lesa",
            "wn", "wna"
        ];
        const insultMatch = text.match(new RegExp(`\\b(${insults.join("|")})\\b`, "i"));

        if (insultMatch) {
            return `😐 ¿Cómo que "${insultMatch[0]}"?`;
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

        /* 🙏 Disculpa del usuario */
        if (/lo siento|perd[oó]n|disculpa/i.test(text)) {
            botStatus.leadErrors = 0;
            botStatus.phase = "waiting_offer_intro";
            return "😊 No hay problema.\n¿Te gustaría ver las ofertas de hoy?";
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
                botStatus.leadErrors = (botStatus.leadErrors ?? 0) + 1;

                if (botStatus.leadErrors >= 2) {
                    botStatus.leadErrors = 0; // reset
                    botStatus.phase = "waiting_offer_intro";

                    return `😅 Veo que está siendo complicado.

¿Quieres que volvamos a ver las ofertas o prefieres intentarlo más tarde?`;
                }

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
                botStatus.leadErrors = 0;

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

        const flowBroken =
            isFlowBreaking(text) &&
            !["waiting_offer_selection", "waiting_confirmation", "waiting_lead"].includes(phase);

        /* ❌ RECHAZO DE OFERTA EN CONFIRMACIÓN */
        if (
            phase === "waiting_confirmation" &&
            /\b(no|no gracias|mejor no|prefiero otra|no me convence)\b/i.test(text)
        ) {
            botStatus.leadOffer = null;
            botStatus.phase = "waiting_offer_selection";

            return "👌 Sin problema. ¿Prefieres la *Oferta 1* o la *Oferta 2*?";
        }

        /* 🤔 APROBACIÓN BLANDA SIN CONFIRMAR */
        if (
            phase === "waiting_confirmation" &&
            botStatus.leadOffer &&
            /\b(me gusta|me agrada|me sirve|está bien|esta bien|me tinca|interesante|suena bien)\b/i.test(text)
        ) {
            return "😊 ¡Genial! Para continuar, solo necesito que me confirmes escribiendo *sí* o *confirmo*.";
        }

        /* 🧱 CONTENCIÓN FINAL DE SELECCIÓN DE OFERTA */
        if (
            phase === "waiting_offer_selection" &&
            !isOffer1 &&
            !isOffer2 &&
            !/\b(oferta|opción|opcion)\b/i.test(text)
        ) {
            return "🙂 Para continuar, dime qué opción prefieres:\n*1* Pago único\n*2* Suscripción mensual";
        }


        return await sendToAI(
            [{ role: "user", content: text }],
            {
                intent: flowBroken ? "out_of_flow" : "in_flow"
            }
        );


    } catch (err: any) {
        console.error("🤖 Error en handleChat:", err);

        if (err?.message === "EMPTY_AI_RESPONSE") {
            return "⚠️ En este momento no puedo responder. Intenta nuevamente.";
        }

        // fallback seguro
        return "⚠️ El asistente está teniendo dificultades momentáneas. Intenta nuevamente en unos segundos.";
    }
}
