/* CC Driving Instruction — Cloudflare Worker
 *
 * Serves the static site (via the ASSETS binding) and handles lead capture.
 * When a visitor picks a package and submits the referral modal, the browser
 * POSTs to /api/lead. We email the lead to rico@ccdrvn.com via SendGrid, then
 * the browser redirects the visitor on to the partner school's enrollment page.
 *
 * Requires secret: SENDGRID_API_KEY  (wrangler secret put SENDGRID_API_KEY)
 */

const LEAD_TO     = "rico@ccdrvn.com";   // where leads are sent
const LEAD_FROM   = "rico@ccdrvn.com";   // SendGrid-verified sender
const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/lead") {
      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, 405);
      }
      return handleLead(request, env);
    }

    // Everything else: serve the static site.
    return env.ASSETS.fetch(request);
  },
};

async function handleLead(request, env) {
  let data;
  try {
    data = await request.json();
  } catch (_) {
    return json({ error: "Invalid request" }, 400);
  }

  const name    = String(data.name    || "").trim().slice(0, 200);
  const email   = String(data.email   || "").trim().slice(0, 200);
  const pkg     = String(data.package || "").trim().slice(0, 200);
  const honey   = String(data.company || "").trim();   // honeypot (hidden field)

  // Bot trap: real users never fill the hidden "company" field.
  if (honey) return json({ ok: true });

  if (!name || !EMAIL_RE.test(email)) {
    return json({ error: "Name and a valid email are required." }, 422);
  }

  const apiKey = env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error("SENDGRID_API_KEY is not set");
    return json({ error: "Server not configured." }, 500);
  }

  const when = new Date().toISOString();
  const plain =
    `New package inquiry from ccdrvn.com\n\n` +
    `Package: ${pkg || "(not specified)"}\n` +
    `Name:    ${name}\n` +
    `Email:   ${email}\n` +
    `Time:    ${when}\n\n` +
    `Reply directly to this email to reach the prospect.`;

  const payload = {
    personalizations: [{ to: [{ email: LEAD_TO }] }],
    from: { email: LEAD_FROM, name: "CC Driving — Website Lead" },
    reply_to: { email: email, name: name },
    subject: `New lead: ${pkg || "package inquiry"} — ${name}`,
    content: [{ type: "text/plain", value: plain }],
  };

  const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (resp.status >= 200 && resp.status < 300) {
    return json({ ok: true });
  }

  const body = await resp.text().catch(() => "");
  console.error("SendGrid error", resp.status, body);
  return json({ error: "Could not send. Please try again." }, 502);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
