import emailjs from "@emailjs/browser";

export function sendLeadEmail({ email, business, offer }) {
    return emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
            user_email: email,
            business_name: business,
            offer
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    );
}
