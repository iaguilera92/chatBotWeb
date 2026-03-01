export type BotPhase =
    | "EXISTING_CLIENT"
    | "OFFER_INTRO"
    | "OFFER_SELECTION"
    | "OFFER_CONFIRMATION"
    | "LEAD_EMAIL_CAPTURE"
    | "LEAD_BUSINESS_CAPTURE"
    | "LEAD_COMPLETED";

export interface BotStatus {
    phase: BotPhase;

    waitingMessageStep: number;
    skipExistingClient: boolean;
    clientPhone: string | null;

    leadEmail: string | null;
    leadBusinessName: string | null;
    leadOffer: string | null;

    leadEmailSent: boolean;
    leadRegisteredAt: string | null;
    leadErrors: number;

    workInProgressId: string | null;
}