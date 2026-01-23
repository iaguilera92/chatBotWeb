import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function getTimeUntilMonthlyReset(): string {
  const now = new Date();

  // Próximo día 1 del mes, 00:00
  const nextReset = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1,
    0,
    0,
    0
  );

  const diffMs = nextReset.getTime() - now.getTime();

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor(
    (diffMs % (1000 * 60 * 60)) / (1000 * 60)
  );

  return `${hours} h ${minutes} min`;
}


export async function notifyAdminBotDown({
  reason,
  disabledAt,
  retryAfter,
}: {
  reason: string;
  disabledAt: Date;
  retryAfter?: string | null;
}) {
  const year = new Date().getFullYear();
  const since = disabledAt.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const retryRow = retryAfter
    ? `
<tr>
  <td style="padding:6px 10px 6px 0;font-weight:bold;">⏳ Vuelve en:</td>
  <td style="padding:6px 0;">${retryAfter}</td>
</tr>`
    : "";


  const html = `
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f2f2f2;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <tr>
    <td align="center" style="padding:20px 0;">

      <!-- CONTENEDOR -->
      <table width="600" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background-color:#ffffff;border:1px solid #ddd;border-radius:16px;overflow:hidden;">

        <!-- HEADER -->
        <tr>
          <td align="center" style="background-color:#8f0000;padding:12px;">
            <img src="https://plataformas-web.cl/logo-plataformas-web-rojo.webp" height="40" alt="Plataformas Web" style="display:block;margin:10px auto;">
            <p style="margin:10px 0 0;color:#ffffff;font-size:14px;font-weight:600;">
              🚨 PWBot Inactivo
            </p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:20px 24px;color:#212121;font-size:13px;">

            <p style="color:#8f0000;font-weight:600;margin:0 0 12px;">
              Bot inactivo – acción manual requerida
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdecea;border:1px solid #f5c6cb;border-radius:8px;margin-bottom:16px;">
              <tr>
                <td style="padding:12px;color:#b71c1c;font-size:12px;">
                  ⚠️ <strong>PWBot ${year}</strong> no está atendiendo clientes.
                  La atención debe ser realizada manualmente hasta su reactivación.
                </td>
              </tr>
            </table>

            <!-- INFO -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa;border-radius:8px;">
              <tr>
                <td style="padding:12px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;border-collapse:collapse;">
                    <tr>
                      <td style="padding:6px 10px 6px 0;font-weight:bold;">🕒 Hora caída:</td>
                      <td style="padding:6px 0;">${since}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 10px 6px 0;font-weight:bold;">📛 Motivo:</td>
                      <td style="padding:6px 0;">${reason}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 10px 6px 0;font-weight:bold;">🤖 Estado:</td>
                      <td style="padding:6px 0;">Desactivado</td>
                    </tr>

                    ${retryAfter ? `
                    <tr>
                      <td style="padding:6px 10px 6px 0;font-weight:bold;">⏳ Vuelve en:</td>
                      <td style="padding:6px 0;">${retryAfter}</td>
                    </tr>` : ""}

                    <tr>
                      <td style="padding:6px 10px 6px 0;font-weight:bold;">👤 Atención humana:</td>
                      <td style="padding:6px 0;">Activa 🟢</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:14px 0 0;font-size:11px;color:#777;text-align:center;">
              ⓘ Tiempo estimado según límites de OpenAI.
            </p>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td align="center" style="background-color:#8f0000;padding:16px;color:#ffffff;">
            <p style="margin:0;font-size:13px;">
              📧 <a href="mailto:plataformas.web.cl@gmail.com" style="color:#ffc002;text-decoration:none;">
                plataformas.web.cl@gmail.com
              </a>
            </p>
            <p style="margin-top:8px;font-size:11px;color:rgba(255,255,255,.75);">
              Alerta automática PWBot ${year}
            </p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

`;


  await transporter.sendMail({
    from: "PWBot Alertas <pwbot.ia@gmail.com>",
    to: "plataformas.web.cl@gmail.com",
    subject: "🚨 PWBot desactivado por límite de OpenAI",
    html,
  });
}
