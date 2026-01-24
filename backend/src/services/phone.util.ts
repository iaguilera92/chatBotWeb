export function normalizePhone(phone?: string) {
    if (!phone) return "";
    return phone.replace(/\D/g, "");
}
