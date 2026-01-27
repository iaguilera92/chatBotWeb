import fetch from "node-fetch";

type LeadEmailParams = {
  email: string;
  business: string;
  offer: string;
};

export async function sendLeadEmail({
  email,
  business,
  offer,
}: LeadEmailParams) {
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID,      // service_afi4p3g
      template_id: process.env.EMAILJS_TEMPLATE_ID,    // template_q2qi8vq
      user_id: process.env.EMAILJS_PUBLIC_KEY,         // BJsyiI89dERTgGOZ2
      template_params: {
        business_name: business,
        user_email: email,
        offer: offer,
      },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`EMAILJS_FAILED: ${error}`);
  }
}
