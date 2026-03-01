import { sendToAI } from "./groq.service";
import { sendLeadEmail } from "./email.service";
import { finishConversation, saveMessage } from "../services/conversations.store";
import { OfferResumen, OffersText, capitalizeFirst, checkInsults, formatDate, checkExactResponses } from "../helpers/HelperChat";
import { UiMessage } from "../models/Chats";
import { s3TrabajoEnRevision } from "../services/trabajos.s3.service";
import { getBotStatus, saveBotStatus } from "../state/botStatus.store";
import { BotStatus } from "../state/botStatus.types";

const SIMULATE_PHONE = process.env.SIMULATE_PHONE === "1";

// ================= HANDLER PRINCIPAL =================
export async function handleChat(
    sessionId: string,
    messages: UiMessage[]
): Promise<string> {

    try {

        const botStatus = await getBotStatus(sessionId);
        console.log("------HANDLE CHAT------");
        console.log("FASE ACTUAL:", botStatus.phase);

        const lastUserMessage = [...messages]
            .reverse()
            .find(m => m.from === "user" && typeof m.text === "string");

        const lastMessage = messages[messages.length - 1];

        if (!lastMessage || lastMessage.from !== "user") return "";
        if (!lastUserMessage?.text?.trim()) return "¿Te gustaría ver las ofertas de hoy?";

        const textRaw = lastUserMessage.text.trim();
        const text = textRaw.toLowerCase();
        const textClean = text.replace(/[^\w\sáéíóúñ]/gi, "").trim();
        const normalized = textClean
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        //AFIRMACIONES
        const isAffirmative = /\b(si|ok|dale|claro|perfecto|bueno|de acuerdo|vamos|por supuesto|obvio|vale|listo)\b/.test(normalized);

        const negativeKeywords = [
            "no", "no gracias", "prefiero no", "mejor no", "ninguna",
            "ninguno", "ninguna de las dos", "paso", "nop",
            "no quiero", "no me interesa", "no me gusto", "no me gustó"
        ];
        //NEGATIVAS
        const isNegative = negativeKeywords.some(keyword =>
            normalized === keyword || normalized.startsWith(keyword + " ")
        );
        //SALUDOS
        const greetingKeywords = [
            "hola", "holi", "buenas", "buenos dias", "buenos días",
            "buenas tardes", "buenas noches", "hey", "hi",
            "hello", "qué tal", "que tal", "saludos"
        ];

        const isGreeting = greetingKeywords.some(keyword =>
            normalized.includes(keyword)
        );

        //CONFIRMACIÓN
        const isConfirmation =
            /\bconfirm(o|ar|ado)\b/.test(normalized) ||
            /\b(si|ok|dale|perfecto|vale)\b.*\bconfirmo\b/.test(normalized);

        const resetToIntro = () => {
            botStatus.phase = "OFFER_INTRO";
            botStatus.leadEmail = null;
            botStatus.leadBusinessName = null;
            botStatus.leadOffer = null;
            botStatus.leadEmailSent = false;
            botStatus.leadRegisteredAt = null;
            botStatus.leadErrors = 0;
            botStatus.workInProgressId = null;
        };

        const handleFlowBroken = async () => {
            const aiResponse = await sendToAI(
                [{ role: "user", content: textRaw }],
                { intent: "out_of_flow" }
            );

            resetToIntro();
            await saveBotStatus(sessionId, botStatus);

            return aiResponse + "\n\n👉 ¿Te gustaría ver las ofertas de hoy?";
        };

        const exactResponse = checkExactResponses(textRaw);
        if (exactResponse) return exactResponse;

        const insultResponse = checkInsults(textRaw);
        if (insultResponse) return insultResponse;

        let response = "";

        switch (botStatus.phase) {

            case "OFFER_INTRO":

                if (isGreeting) {
                    response = "¡Hola! 🙋‍♂️ ¿Te gustaría ver las ofertas de hoy?";
                    break;
                }

                if (isAffirmative) {
                    botStatus.phase = "OFFER_SELECTION";
                    response = OfferResumen;
                    break;
                }

                if (isNegative) {
                    response = "🙂 Está bien. Cuando quieras ver las ofertas, dime *sí*.";
                    break;
                }

                return await handleFlowBroken();


            case "OFFER_SELECTION":

                const isOffer1 = /\b1\b/.test(normalized) || /oferta\s*1/.test(normalized);
                const isOffer2 = /\b2\b/.test(normalized) || /oferta\s*2/.test(normalized);

                if (isOffer1) {
                    botStatus.leadOffer = "Oferta 1 - Pago único";
                    botStatus.phase = "OFFER_CONFIRMATION";
                    response = OffersText.offer1;
                    break;
                }

                if (isOffer2) {
                    botStatus.leadOffer = "Oferta 2 - Suscripción mensual";
                    botStatus.phase = "OFFER_CONFIRMATION";
                    response = OffersText.offer2;
                    break;
                }

                if (isNegative) {
                    response = "🙂 Perfecto. Cuando quieras continuar, dime *sí*.";
                    break;
                }

                const containsNumber = /\b\d+\b/.test(normalized);
                if (containsNumber) {
                    response = "🤔 Solo tenemos la *Oferta 1* o la *Oferta 2*.\n¿Cuál prefieres?";
                    break;
                }

                return await handleFlowBroken();


            case "OFFER_CONFIRMATION":

                if (isConfirmation || isAffirmative) {
                    botStatus.phase = "LEAD_EMAIL_CAPTURE";
                    response = "Perfecto 😊 indícanos tu *correo electrónico* para generar tu solicitud.";
                    break;
                }

                if (isNegative) {
                    botStatus.phase = "OFFER_SELECTION";
                    response = "👌 Está bien. ¿Prefieres la *Oferta 1* o la *Oferta 2*?";
                    break;
                }

                return await handleFlowBroken();


            case "LEAD_EMAIL_CAPTURE":

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const isValidEmail = emailRegex.test(textRaw);

                if (isValidEmail) {
                    botStatus.leadEmail = textRaw;
                    botStatus.phase = "LEAD_BUSINESS_CAPTURE";
                    botStatus.leadErrors = 0;
                    response = "Genial 👍 ahora indícanos el *nombre del negocio* o *emprendimiento* para finalizar tu solicitud.";
                    break;
                }

                if (isNegative) {
                    response = "🙂 Cuando estés listo, indícanos tu *correo electrónico* para generar tu solicitud.";
                    break;
                }

                botStatus.leadErrors += 1;

                if (botStatus.leadErrors < 2) {
                    response = "⚠️ Parece que el correo que ingresaste no es válido. Por favor, vuelve a intentarlo.";
                    break;
                }

                return await handleFlowBroken();


            case "LEAD_BUSINESS_CAPTURE":

                const businessName = textRaw.trim();

                if (businessName.length >= 2 && botStatus.leadEmail) {

                    botStatus.leadBusinessName = capitalizeFirst(businessName);
                    botStatus.phase = "LEAD_COMPLETED";
                    botStatus.leadErrors = 0;

                    response = await processLead(
                        botStatus,
                        botStatus.leadEmail,
                        botStatus.leadBusinessName
                    );

                    break;
                }

                if (isNegative) {
                    response = "🙂 Cuando quieras continuar, indícanos el *nombre del negocio* o *emprendimiento* para generar tu solicitud.";
                    break;
                }

                botStatus.leadErrors += 1;

                if (botStatus.leadErrors < 2) {
                    response = "⚠️ El nombre que ingresaste no parece válido. Por favor, vuelve a intentarlo.";
                    break;
                }

                return await handleFlowBroken();


            case "LEAD_COMPLETED":

                const seguimientoLink = botStatus.workInProgressId
                    ? `https://www.plataformas-web.cl/?workInProgress=${botStatus.workInProgressId}`
                    : "https://www.plataformas-web.cl/";

                if (isNegative) {
                    const link = seguimientoLink;
                    resetToIntro();
                    response = `🙂 Gracias por tu tiempo. Un analista se pondrá en contacto contigo.\n${link}`;
                    break;
                }

                if (isAffirmative) {
                    const link = seguimientoLink;
                    resetToIntro();
                    response = `🎉 ¡Excelente! Gracias por completar tu registro.\n${link}`;
                    break;
                }

                resetToIntro();
                response = `✅ Gracias por completar tu registro.\n${seguimientoLink}`;
                break;
        }

        await saveBotStatus(sessionId, botStatus);
        return response;

    } catch (err) {
        console.error("Error en handleChat:", err);
        return "⚠️ El asistente tuvo un problema. Intenta nuevamente.";
    }
}

// ================= PROCESAR LEAD =================
async function processLead(state: BotStatus, email: string, business: string): Promise<string> {

    try {

        await sendLeadEmail({
            email,
            business,
            offer: state.leadOffer ?? "Oferta no especificada",
        });

        state.leadEmailSent = true;
        state.leadRegisteredAt = new Date().toISOString();
        state.phase = "LEAD_COMPLETED";
        state.leadErrors = 0;

        const phone = SIMULATE_PHONE
            ? "+569" + Math.floor(10000000 + Math.random() * 90000000)
            : null;

        if (phone) {

            const resumen = `Datos del cliente:\n\n📧 Correo: ${email}\n🏢 Negocio: ${business}\n💰 Oferta: ${state.leadOffer ?? "Oferta no especificada"}\n🕒 Recibido: ${formatDate(new Date())}`;

            await saveMessage(phone, "user", resumen);

            const newId = await s3TrabajoEnRevision({
                email,
                business,
                phone,
                offer: state.leadOffer ?? undefined,
            });

            const workId = String(newId);
            state.workInProgressId = workId;

            await finishConversation(phone, {
                leadEmail: state.leadEmail ?? undefined,
                leadBusiness: state.leadBusinessName ?? undefined,
                leadOffer: state.leadOffer ?? undefined,
            });

            return `Listo! ✅ Te enviamos un *correo*.\nSeguimiento aquí:\nhttps://www.plataformas-web.cl/?workInProgress=${workId}`;
        }

        return "Listo! ✅📧 Te enviamos un correo y te contactaremos 👨‍💻";

    } catch (e) {
        console.error("📧 Error al enviar correo", e);
        return "⚠️ Hubo un problema al registrar tus datos. Intenta nuevamente.";
    }
}