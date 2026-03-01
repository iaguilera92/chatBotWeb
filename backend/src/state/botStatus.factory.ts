import { BotStatus } from "./botStatus.types";

export function getInitialBotStatus(): BotStatus {
    return {
        phase: "OFFER_INTRO",

        waitingMessageStep: 0,
        skipExistingClient: false,
        clientPhone: null,

        leadEmail: null,
        leadBusinessName: null,
        leadOffer: null,

        leadEmailSent: false,
        leadRegisteredAt: null,
        leadErrors: 0,

        workInProgressId: null,
    };
}