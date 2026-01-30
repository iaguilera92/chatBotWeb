import axios from "axios";

export type LeadEmailParams = {
  email: string;
  business: string;
  offer: string;
};

export async function sendLeadEmail({
  email,
  business,
  offer,
}: LeadEmailParams): Promise<void> {

  const year = new Date().getFullYear();

  const html = `
    <h3>🤖 Nueva solicitud desde PWBot ${year}</h3>
    <p><strong>Negocio:</strong> ${business}</p>
    <p><strong>Correo:</strong> ${email}</p>
    <p><strong>Oferta:</strong> ${offer}</p>
  `;

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        name: "PWBot",
        email: "no-reply@plataformas-web.cl", // verificado en Brevo
      },
      to: [{ email }],
      cc: [{ email: "plataformas.web.cl@gmail.com" }],
      subject: `🟢 Plataformas Web - ${business}`,
      htmlContent: html,
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY!,
        "Content-Type": "application/json",
        accept: "application/json",
      },
    }
  );

  console.log("📧 [EMAIL] Enviado vía Brevo API REST");
}
