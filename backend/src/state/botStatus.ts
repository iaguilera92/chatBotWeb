export type BotPhase =
    | "OFFER_INTRO"
    | "OFFER_SELECTION"
    | "OFFER_CONFIRMATION"
    | "LEAD_EMAIL_CAPTURE"
    | "LEAD_BUSINESS_CAPTURE"
    | "LEAD_COMPLETED"
    | "EXISTING_CLIENT";;

export const botStatus = {
    enabled: true,
    disabledAt: null as Date | null,
    reason: null as string | null,

    // 🧠 FASE ACTUAL DEL FLUJO
    phase: "OFFER_INTRO" as BotPhase,

    // 📧 DATOS DEL LEAD
    leadEmailSent: false,
    leadEmail: null as string | null,
    leadOffer: null as string | null,
    leadBusinessName: null as string | null,
    leadRegisteredAt: null as Date | null,
    leadErrors: 0,

    // 🔗 LINK DE SEGUIMIENTO DEL LEAD
    workInProgressId: null as string | null,

    // 💬 HISTORIAL DE MENSAJES
    messages: [] as {
        from: "user" | "bot";
        text: string;
        timestamp: Date
    }[],

    // 🔴 CONTROL DE NEGATIVAS
    negativeResponses: 0,

    // 🔄 CONTROL DE RESET
    resets: 0,

    // 👥 CLIENTE EXISTENTE
    existingClient: false,  // si es cliente habitual detectado
    waitingMessageStep: 0,
    skipExistingClient: false,
    clientPhone: null as string | null, // teléfono detectado
};