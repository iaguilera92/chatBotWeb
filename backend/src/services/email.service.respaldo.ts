import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // TLS
    auth: {
        user: process.env.SMTP_USER, // pwbot.ia@gmail.com
        pass: process.env.SMTP_PASS,
    },
});

export async function sendLeadEmail({
    email,
    business,
    offer,
}: {
    email: string;
    business: string;
    offer: string;
}) {
    const year = new Date().getFullYear();

    const html = `
<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #212121;">
  <div style="max-width: 600px; margin: auto; border: 1px solid #b3b1b1; border-radius: 16px; overflow: hidden;">

    <div style="text-align: center; background-color: #0a0f2c; padding: 10px 0;">
      <a href="https://plataformas-web.cl" style="text-decoration: none;">
        <img
          src="https://plataformas-web.cl/logo-plataformas-web-correo.webp"
          alt="Plataformas Web"
          height="40"
          style="margin-top: 10px;"
        />
      </a>
      <h4 style="color: #ffffff; margin: 15px 0 5px; font-weight: 600;">
        🤖 Nueva solicitud desde PWBot
      </h4>
    </div>

    <div style="padding: 20px 24px; background-color: #ffffff;">

      <p style="color: #0a0f2c; font-size: 13px; font-weight: 600; margin: 0 0 16px;">
        ¡Nuevo cliente interesado!
      </p>

      <p style="background-color: #e8f5e9; color: #1b5e20; padding: 10px; border-radius: 8px; border: 1px solid #a5d6a7; font-size: 12px; margin: 0 0 20px;">
        ✅ Un cliente completó el proceso de interés a través del asistente <strong>PWBot ${year}</strong>.
      </p>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <tr>
          <td style="padding: 6px 10px 6px 0; font-weight: bold;">🏷️ Negocio:</td>
          <td style="padding: 6px 0;">${business}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px 6px 0; font-weight: bold;">📧 Correo:</td>
          <td style="padding: 6px 0;">
            <a href="mailto:${email}" style="color: #0d47a1; text-decoration: none;">
              ${email}
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 10px 6px 0; font-weight: bold;">📦 Oferta elegida:</td>
          <td style="padding: 6px 0;">${offer}</td>
        </tr>
      </table>

      <p style="margin: 25px 0 0; font-size: 12px; color: #444; text-align: center;">
        💡 Te contactaremos pronto por WhatsApp o correo para avanzar con tu sitio web.
      </p>
    </div>

    <div style="text-align: center; background-color: #0a0f2c; color: #ffffff; padding: 16px;">
      <p style="margin: 4px 0; font-size: 13px;">
        📞 <a href="tel:+56946873014" style="color: #ffc002; text-decoration: none;">
          +56 9 4687 3014
        </a>
      </p>
      <p style="margin: 4px 0; font-size: 13px;">
        📧 <a href="mailto:plataformas.web.cl@gmail.com" style="color: #ffc002; text-decoration: none;">
          plataformas.web.cl@gmail.com
        </a>
      </p>
      <p style="margin-top: 12px; font-size: 11px; color: #aaa;">
        Correo generado automáticamente por PWBot ${year}
      </p>
    </div>

  </div>
</div>
`;

    const info = await transporter.sendMail({
        from: "PWBot <pwbot.ia@gmail.com>",      // 👈 remitente
        to: email,                               // 👈 cliente
        cc: "plataformas.web.cl@gmail.com",      // 👈 copia interna
        subject: `🟢 Plataformas Web - ${business} (PWBot ${year})`,
        html,
    });

    return info;
}
