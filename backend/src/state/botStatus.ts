export type BotPhase =
    | "idle"
    | "waiting_offer_intro"
    | "waiting_offer_selection"
    | "waiting_confirmation"
    | "waiting_lead"
    | "lead_sent";
    

export const botStatus = {
    enabled: true,
    disabledAt: null as Date | null,
    reason: null as string | null,

    // 🧠 ESTADO DEL FLUJO
    phase: "idle" as BotPhase,

    // 📧 DATOS DEL LEAD
    leadEmailSent: false,
    leadEmail: null as string | null,
    leadOffer: null as string | null,
    leadRegisteredAt: null as Date | null,
    leadErrors: 0,
};
