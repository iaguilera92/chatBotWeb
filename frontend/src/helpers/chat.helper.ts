export function getWaitingLeadPlaceholder(convo: {
    leadEmail?: string;
    leadBusiness?: string;
    leadOffer?: string;
    leadRegisteredAt?: number | string | Date;
}): string {
    if (!convo) return "Información del cliente no disponible.";

    const email = convo.leadEmail ?? "No registrado";
    const business = convo.leadBusiness ?? "No registrado";
    const offer = convo.leadOffer ?? "No especificada";

    let dateStr = "Fecha desconocida";
    if (convo.leadRegisteredAt) {
        const d = new Date(convo.leadRegisteredAt);
        const hours = d.getHours().toString().padStart(2, "0");
        const minutes = d.getMinutes().toString().padStart(2, "0");
        const day = d.getDate().toString().padStart(2, "0");
        const month = (d.getMonth() + 1).toString().padStart(2, "0");
        const year = d.getFullYear();
        dateStr = `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    return `Información recibida del cliente:
📧 Correo: ${email}
🏢 Negocio: ${business}
💰 Oferta: ${offer}

🕒 Recibido: ${dateStr}`;
}
