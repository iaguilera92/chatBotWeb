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
export function isFlowBreaking(text: string) {
    return !(
        /^(si|sí|no|ok|dale|1|2|confirmo|confirmar)$/i.test(text) ||
        /^[^\s@]+@[^\s@]+\.[^\s@]+/.test(text)
    );
}
export function capitalizeFirst(text: string) {
    if (!text) return "";
    text = text.trim();
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
