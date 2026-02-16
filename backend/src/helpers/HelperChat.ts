// RESUMEN OFERTAS
export const OfferResumen = `*Oferta 1: Pago único*
💰 Reserva inicial: $29.990 CLP
💵 Pago final: $70.000 CLP
🧾 Inversión total: $99.990 CLP
⏱️ Tiempo de desarrollo: 3 a 7 días

*Oferta 2: Suscripción mensual*
🚀 Desarrollo inicial: $29.990 CLP
📆 Suscripción mensual: $9.990 CLP
⚡ Tiempo de desarrollo: 72 hrs

¿Cuál oferta te interesa más? 😊`;

// DETALLE OFERTAS
export const OffersText = {
    offer1: `DETALLE – *Oferta 1: Pago único*

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

*¿Confirmas esta opción?* 👨‍💻`,

    offer2: `DETALLE – *Oferta 2: Suscripción mensual*

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

*¿Confirmas esta opción?* 👨‍💻`,
};

//INSULTOS
export const insults = [
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

//METODOS
export function capitalizeFirst(text: string) {
    if (!text) return "";
    text = text.trim();
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function formatDate(date: Date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "p.m." : "a.m.";
    hours = hours % 12;
    hours = hours ? hours : 12; // convertir 0 => 12

    return `${day}/${month}/${year} ${hours}:${minutes}${ampm}`;
}
//INSULTOS
export function checkInsults(textRaw: string): string | null {
    const insultMatch = textRaw.match(new RegExp(`\\b(${insults.join("|")})\\b`, "i"));
    if (insultMatch) {
        return `😐 ¿Cómo que "${insultMatch[0]}"?`;
    }
    return null;
}
//MENSAJES DIRECTOS
export function checkExactResponses(textRaw: string): string | null {
    const textLower = textRaw.toLowerCase();

    if (textLower === "conoces a maivelyn?") {
        return "💖 Maivelyn Sanchez es el amor de Ignacio Aguilera, administrador de Plataformas Web ✨ La mujer de sus sueños, que ama con todo su corazón ❤️";
    }

    if (textLower === "conoces a james?") {
        return "🐶 James es el perrito del Administrador, es mejor perro de todos, mamon y las mejores orejas ❤️.";
    }

    return null;
}
export async function checkClientInHistory(phone: string): Promise<boolean> {
    // Aquí revisas tu Redis, S3, DB, etc.
    // Devuelve true si ya existe, false si no
    // Por ahora simulamos:
    const existingClients = ["+56992914526", "+56987654321"];
    return existingClients.includes(phone);
}