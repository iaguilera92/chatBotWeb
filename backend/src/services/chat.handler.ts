import { sendToAI } from "./groq.service";
import { sendLeadEmail } from "./email.service";
import { botStatus } from "../state/botStatus";
import { redisSafe } from "../lib/redis";
import { finishConversation, saveMessage } from "../services/conversations.store";
import { OfferResumen, OffersText, capitalizeFirst, isFlowBreaking, insults, formatDate } from "../helpers/HelperChat";
import { UiMessage } from "../models/Chats";
import { s3TrabajoEnRevision } from "../services/trabajos.s3.service";

const SIMULATE_PHONE = process.env.SIMULATE_PHONE === "1";

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

        function normalizeText(str: string) {
            return str
                .toLowerCase()
                .replace(/[\*_\u00A0]/g, "") // eliminar *, _, NBSP
                .replace(/[\p{Emoji}]/gu, "") // eliminar emojis
                .trim();
        }

        // 🔴 ÚLTIMO CHAT BOT
        const lastBotMessage =
            [...messages]
                .reverse()
                .find(m => m.from === "bot" && typeof m.text === "string")
                ?.text ?? "";

        const PHRASES = {
            OFFER_INTRO: "¿te gustaría ver las ofertas",
            OFFER_SELECTION: "¿cuál oferta te interesa",
            CONFIRMATION: "¿confirmas esta opción",
            LEAD_REQUEST: "tu correo electrónico",
            LEAD_BUSINESS: "ahora indícame el nombre del negocio",
            LEAD_SENT: "te enviamos un correo",
        };

        // FASE
        const normalizedBotMessage = normalizeText(lastBotMessage);

        const phase =
            normalizedBotMessage.includes(PHRASES.OFFER_INTRO)
                ? "waiting_offer_intro"
                : normalizedBotMessage.includes(PHRASES.OFFER_SELECTION)
                    ? "waiting_offer_selection"
                    : normalizedBotMessage.includes(PHRASES.CONFIRMATION)
                        ? "waiting_confirmation"
                        : normalizedBotMessage.includes(PHRASES.LEAD_REQUEST)
                            ? "waiting_lead"
                            : normalizedBotMessage.includes(PHRASES.LEAD_BUSINESS)
                                ? "waiting_business"
                                : normalizedBotMessage.includes(PHRASES.LEAD_SENT)
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

        if (isGreeting) {
            if (phase === "idle") {
                botStatus.phase = "waiting_offer_intro";
                return "Hola 🙋‍♂️\n¿Te gustaría ver las ofertas de hoy?";
            } else {
                // Saludo mientras hay un flujo activo
                return "😊 ¡Bienvenido de nuevo! ¿Quieres continuar viendo las ofertas de hoy?";
            }
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
            return OfferResumen;
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
            return OffersText.offer1;
        }

        if (isOffer2 && phase === "waiting_offer_selection") {
            botStatus.phase = "waiting_confirmation";
            botStatus.leadOffer = "Oferta 2 - Suscripción mensual";
            return OffersText.offer2;
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

        // ❌ Solo bloquear si NO estamos ingresando un nuevo lead
        if (lastMessageWasLeadConfirmation && !["waiting_lead", "waiting_business"].includes(phase)) {
            return "✅ Ya tenemos tus datos. Te contactaremos pronto 👨‍💻";
        }

        /* 🙏 Disculpa del usuario */
        if (/lo siento|perd[oó]n|disculpa/i.test(text)) {
            botStatus.leadErrors = 0;
            botStatus.phase = "waiting_offer_intro";
            return "😊 No hay problema.\n¿Te gustaría ver las ofertas de hoy?";
        }



        /**** FINAL:📧 Detectar correo y negocio ****/
        if (phase === "waiting_lead") {
            const onlyEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);

            if (onlyEmail) {
                // Guardamos el email y pasamos a esperar negocio
                botStatus.leadEmail = text;
                botStatus.phase = "waiting_business";
                return `Perfecto 👍 ahora indícame el *nombre del negocio o emprendimiento*`;
            }

            const match = text.match(/^([^\s@]+@[^\s@]+\.[^\s@]+)\s+(.+)$/);
            if (!match) {
                botStatus.leadErrors = (botStatus.leadErrors ?? 0) + 1;

                if (botStatus.leadErrors >= 2) {
                    botStatus.leadErrors = 0;
                    botStatus.phase = "waiting_offer_intro";
                    return `😅 Veo que está siendo complicado.\n\n¿Quieres que volvamos a ver las ofertas o prefieres intentarlo más tarde?`;
                }

                return `⚠️ Formato incorrecto.\nPor favor envíame:\n1) Tu correo electrónico\n2) Nombre del negocio\n\nEjemplo:\ncorreo@dominio.cl Mi Negocio`;
            }

            const email = match[1];
            const business = capitalizeFirst(match[2]);

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return `⚠️ El correo ingresado no es válido.\nEjemplo:\ncorreo@dominio.cl Mi Negocio`;
            }

            // Si email + negocio están juntos, procesamos el lead completo
            return await processLead(email, business);
        }

        /* 📦 Esperar negocio si solo se ingresó email */
        if (phase === "waiting_business") {
            const business = capitalizeFirst(text.trim());
            const email = botStatus.leadEmail!;
            return await processLead(email, business);
        }
        //****FIN****


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

/* FINALIZAR CHAT - EN ESPERA*/
async function processLead(email: string, business: string) {
    try {
        // 📨 Enviar correo
        await sendLeadEmail({
            email,
            business,
            offer: botStatus.leadOffer ?? "Oferta no especificada",
        });

        // Actualizar botStatus
        botStatus.leadEmailSent = true;
        botStatus.leadEmail = email;
        botStatus.leadRegisteredAt = new Date();
        botStatus.phase = "lead_sent";
        botStatus.leadErrors = 0;

        // 🧠 Generar teléfono simulado
        const phone = SIMULATE_PHONE
            ? "+569" + Math.floor(10000000 + Math.random() * 90000000)
            : null;

        if (phone) {
            const resumen = `Datos del cliente:\n\n📧 Correo: ${email}\n🏢 Negocio: ${business}\n💰 Oferta: ${botStatus.leadOffer ?? "Oferta no especificada"}\n🕒 Recibido: ${formatDate(new Date())}`;

            //ÚLTIMO MENSAJE CLIENTE
            await saveMessage(phone, "user", resumen);
            //S3 TRABAJOS
            const newId = await s3TrabajoEnRevision({
                email,
                business,
                phone: phone,
                offer: botStatus.leadOffer ?? undefined,
            });
            //REDIS CONVERSACIÓN
            await finishConversation(phone, {
                leadEmail: botStatus.leadEmail,
                leadOffer: botStatus.leadOffer ?? "Oferta no especificada",
            });

            console.log("💾 Conversación finalizada en Redis:", phone);
            return `Listo! ✅📧 Te enviamos un correo y te contactaremos 👨‍💻\nPuedes hacer seguimiento en: https://www.plataformas-web.cl/?workInProgress=${newId}`;

        }

        return "Listo! ✅📧 Te enviamos un correo y te contactaremos 👨‍💻";

    } catch (e) {
        console.error("📧 Error al enviar correo o guardar conversación", e);
        return "⚠️ Hubo un problema al registrar tus datos. Intenta nuevamente.";
    }
}