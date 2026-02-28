import { sendToAI } from "./groq.service";
import { sendLeadEmail } from "./email.service";
import { botStatus } from "../state/botStatus";
import { finishConversation, saveMessage } from "../services/conversations.store";
import { OfferResumen, OffersText, capitalizeFirst, checkInsults, formatDate, checkExactResponses, checkClientInHistory } from "../helpers/HelperChat";
import { UiMessage } from "../models/Chats";
import { s3TrabajoEnRevision } from "../services/trabajos.s3.service";

const SIMULATE_PHONE = process.env.SIMULATE_PHONE === "1";

// HANDLER PRINCIPAL
export async function handleChat(messages: UiMessage[]): Promise<string> {
    try {
        console.log("------HANDLE CHAT------");

        const lastUserMessage = [...messages]
            .reverse()
            .find(m => m.from === "user" && typeof m.text === "string");

        const lastMessage = messages[messages.length - 1];

        if (!lastMessage || lastMessage.from !== "user") { return ""; }

        if (!lastUserMessage?.text?.trim()) {
            return "¿Te gustaría ver las ofertas de hoy?";
        }


        //DETECTAR SI YA ES CLIENTE
        /*const userPhone = "+56992914526";
        let clientInHistory = false;

        //if (userPhone === "+56992914526") {
        if (userPhone === "+56992914526") {
            clientInHistory = true;
        } else if (userPhone) {
            clientInHistory = await checkClientInHistory(userPhone);
        }*/

        // ⚡ Solo marcar EXISTING_CLIENT si no hemos enviado los mensajes de espera
        /*if (clientInHistory && botStatus.waitingMessageStep === 0 && !botStatus.skipExistingClient) {
            botStatus.phase = "EXISTING_CLIENT";
            botStatus.clientPhone = userPhone;
        }*/

        //TEXTO ESCRITO POR EL CLIENTE
        const textRaw = lastUserMessage.text.trim();
        const text = textRaw.toLowerCase();
        // 🔥 Limpiar emojis y caracteres especiales
        const textClean = text.replace(/[^\w\sáéíóúñ]/gi, "").trim();
        const normalized = textClean
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, ""); // elimina tildes

        //AFIRMACIÓN
        const isAffirmative = /\b(si|ok|dale|claro|perfecto|bueno|de acuerdo|vamos|por supuesto|obvio|vale|listo)\b/.test(normalized);
        //NEGATIVA
        const negativeKeywords = ["no", "no gracias", "prefiero no", "mejor no", "ninguna", "ninguno", "ninguna de las dos", "paso", "nop", "no quiero", "no me interesa", "no me gusto", "no me gustó"];
        const isNegative = negativeKeywords.some(keyword =>
            normalized === keyword || normalized.startsWith(keyword + " ")
        );
        //SALUDO
        const greetingKeywords = ["hola", "holi", "buenas", "buenos dias", "buenos días", "buenas tardes", "buenas noches", "hey", "hi", "hello", "qué tal", "que tal", "saludos"];
        const isGreeting = greetingKeywords.some(keyword => normalized.includes(keyword));
        //CONFIRMAR
        const isConfirmation = /\bconfirm(o|ar|ado)\b/.test(normalized) || /\b(si|ok|dale|perfecto|vale)\b.*\bconfirmo\b/.test(normalized);
        //RESET FLUJO
        const resetToIntro = () => {
            botStatus.phase = "OFFER_INTRO";
            botStatus.leadEmail = null;
            botStatus.leadOffer = null;
            botStatus.leadEmailSent = false;
            botStatus.leadRegisteredAt = null;
            botStatus.leadErrors = 0;
        };
        //SI RESETEO Y EMPIEZA DE NUEVO
        const handleFlowBroken = async () => {
            const aiResponse = await sendToAI(
                [{ role: "user", content: textRaw }],
                { intent: "out_of_flow" }
            );

            resetToIntro();

            return (aiResponse + "\n\n👉 ¿Te gustaría ver las ofertas de hoy?");
        };

        //LIMPIAR
        if (!lastUserMessage) { return ""; }

        //MENSAJES DIRECTOS
        const exactResponse = checkExactResponses(textRaw);
        if (exactResponse) {
            return exactResponse;
        }
        //INSULTOS
        const insultResponse = checkInsults(textRaw);
        if (insultResponse) {
            return insultResponse;
        }
        console.log("FASE ACTUAL:", botStatus.phase);

        switch (botStatus.phase) {

            case "EXISTING_CLIENT":
                // SALUDO inicial
                if (isGreeting) {
                    return "¡Hola de nuevo! 🙋‍♂️ Veo que ya eres cliente de nuestra plataforma.\n*¿Quieres hablar con un analista?*";
                }

                // NEGATIVA / CANCELA
                if (isNegative) {
                    botStatus.waitingMessageStep = 0;
                    botStatus.phase = "OFFER_INTRO";  // volver al flujo normal
                    botStatus.skipExistingClient = true; // evitar que vuelva a EXISTING_CLIENT este ciclo
                    return "🙂 Perfecto. Mientras tanto, puedes descubrir nuestras *ofertas de hoy*. ¿Quieres que te las muestre?";
                }


                // CONFIRMA O AFIRMA
                if (isConfirmation || isAffirmative) {
                    if (botStatus.waitingMessageStep === 0) {
                        botStatus.waitingMessageStep = 1;
                        return "Perfecto 😊 Un *analista* se pondrá en contacto contigo pronto.";
                    } else if (botStatus.waitingMessageStep === 1) {
                        botStatus.waitingMessageStep = 0;
                        botStatus.phase = "OFFER_INTRO"; // volvemos al flujo normal
                        return "Por favor, espéranos un momento, te contactaremos en breve...\n\n👉 Mientras tanto, ¿quieres ver las ofertas de hoy?";
                    }
                }

                // Si ya estamos en el paso de espera y el usuario responde otra cosa
                if (botStatus.waitingMessageStep === 1) {
                    return "🙂 Mientras tanto, puedes consultar nuestras ofertas o preguntarme lo que necesites.";
                }

                // Cualquier otra cosa fuera del flujo
                return await handleFlowBroken();


            // =====================================================
            case "OFFER_INTRO":

                if (isGreeting) {
                    return "¡Hola! 🙋‍♂️ ¿Te gustaría ver las ofertas de hoy?";
                }

                if (isAffirmative) {
                    botStatus.phase = "OFFER_SELECTION";
                    return OfferResumen;
                }

                if (isNegative) {
                    return "🙂 Está bien. Cuando quieras ver las ofertas, dime *sí*.";
                }

                return await handleFlowBroken();

            // =====================================================
            case "OFFER_SELECTION":

                const isOffer1 = /\b1\b/.test(normalized) || /oferta\s*1/.test(normalized);
                const isOffer2 = /\b2\b/.test(normalized) || /oferta\s*2/.test(normalized);

                if (isOffer1) {
                    botStatus.leadOffer = "Oferta 1 - Pago único";
                    botStatus.phase = "OFFER_CONFIRMATION";
                    return OffersText.offer1;
                }

                if (isOffer2) {
                    botStatus.leadOffer = "Oferta 2 - Suscripción mensual";
                    botStatus.phase = "OFFER_CONFIRMATION";
                    return OffersText.offer2;
                }

                if (isNegative) {
                    return "🙂 Perfecto. Cuando quieras continuar, dime *sí*.";
                }

                // 🟡 INVALID INPUT (pero sigue dentro del flujo)
                const containsNumber = /\b\d+\b/.test(normalized);
                if (containsNumber) {
                    return "🤔 Solo tenemos la *Oferta 1* o la *Oferta 2*.\n¿Cuál prefieres?";
                }

                // 🔴 FLOW REALMENTE ROTO
                return await handleFlowBroken();

            // =====================================================
            case "OFFER_CONFIRMATION":

                //VALIDAR CONFIRMACIÓN
                if (isConfirmation || isAffirmative) {
                    botStatus.phase = "LEAD_EMAIL_CAPTURE";
                    return "Perfecto 😊 indícanos tu *correo electrónico* para generar tu solicitud.";
                }

                if (isNegative) {
                    botStatus.phase = "OFFER_SELECTION";
                    return "👌 Está bien. ¿Prefieres la *Oferta 1* o la *Oferta 2*?";
                }

                return await handleFlowBroken();

            // =====================================================
            case "LEAD_EMAIL_CAPTURE":

                // Regex para validar correo
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const isValidEmail = emailRegex.test(textRaw);

                if (isValidEmail) {
                    // ✅ Correo válido → avanzamos a siguiente fase
                    botStatus.leadEmail = textRaw;
                    botStatus.phase = "LEAD_BUSINESS_CAPTURE";
                    botStatus.leadErrors = 0; // resetear errores
                    return "Genial 👍 ahora indícanos el *nombre del negocio* o *emprendimiento* para finalizar tu solicitud.";
                }

                // Si responde negativo
                if (isNegative) {
                    return "🙂 Cuando estés listo, indícanos tu *correo electrónico* para generar tu solicitud.";
                }

                // Correo inválido → contamos intentos
                botStatus.leadErrors = (botStatus.leadErrors || 0) + 1;

                if (botStatus.leadErrors < 2) {
                    return "⚠️ Parece que el correo que ingresaste no es válido. Por favor, vuelve a intentarlo.";
                }

                // Si supera los 2 intentos fallidos, flujo roto
                return await handleFlowBroken();

            // =====================================================
            case "LEAD_BUSINESS_CAPTURE":

                const businessName = textRaw.trim();

                if (businessName.length >= 2 && botStatus.leadEmail) {
                    // ✅ Nombre válido → procesamos el lead
                    botStatus.leadBusinessName = capitalizeFirst(businessName);
                    botStatus.phase = "LEAD_COMPLETED";
                    botStatus.leadErrors = 0; // reiniciamos errores

                    const response = await processLead(
                        botStatus.leadEmail,
                        botStatus.leadBusinessName
                    );

                    return response;
                }

                if (isNegative) {
                    return "🙂 Cuando quieras continuar, indícanos el *nombre del negocio* o *emprendimiento* para generar tu solicitud.";
                }

                botStatus.leadErrors = (botStatus.leadErrors || 0) + 1;

                if (botStatus.leadErrors < 2) {
                    return "⚠️ El nombre que ingresaste no parece válido. Por favor, vuelve a intentarlo.";
                }

                return await handleFlowBroken();


            // =====================================================
            case "LEAD_COMPLETED":
                const seguimientoLink = `https://www.plataformas-web.cl/?workInProgress=${botStatus.workInProgressId}`;

                if (isNegative) {
                    const link = seguimientoLink; // guardar antes del reset
                    resetToIntro(); // reinicia flujo
                    return `🙂 Gracias por tu tiempo. Un analista se pondrá en contacto contigo, por favor espera un momento.\nPodrás hacer seguimiento de tu solicitud en:\n${link}`;
                }

                if (isAffirmative) {
                    const link = seguimientoLink; // guardar antes del reset
                    resetToIntro(); // reinicia flujo
                    return `🎉 ¡Excelente! Gracias por completar tu registro. Un analista se pondrá en contacto contigo pronto.\nPodrás hacer *seguimiento* de tu solicitud en:\n${link}`;
                }

                const link = seguimientoLink;
                resetToIntro();
                return `✅ Gracias por completar tu registro. Podrás hacer seguimiento de tu solicitud en:\n${link}\nUn analista se pondrá en contacto contigo pronto.`;
        }

        return await handleFlowBroken();

    } catch (err) {
        console.error("Error en handleChat:", err);
        return "⚠️ El asistente tuvo un problema. Intenta nuevamente.";
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
        botStatus.phase = "LEAD_COMPLETED";
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
            return `Listo! ✅ Te enviamos un *correo* y nuestro equipo se pondrá en contacto contigo👨‍💻\nPuedes hacer *seguimiento* de tu solicitud aquí: https://www.plataformas-web.cl/?workInProgress=${newId}`;

        }

        return "Listo! ✅📧 Te enviamos un correo y te contactaremos 👨‍💻";

    } catch (e) {
        console.error("📧 Error al enviar correo o guardar conversación", e);
        return "⚠️ Hubo un problema al registrar tus datos. Intenta nuevamente.";
    }
}