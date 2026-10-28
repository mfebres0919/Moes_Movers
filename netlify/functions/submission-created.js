/* ==========================================================================
   Auto-reply for form submissions (Netlify + Brevo)

   Netlify runs this automatically after every form submission it accepts
   (spam caught by the honeypot is skipped). It sends the person a short
   "we got it" email through Brevo, styled like movewithmoehtx.com: teal and
   yellow, square corners, Bebas-style headings, Moe's photo in the sign-off.

   Needs two environment variables in Netlify (Site configuration >
   Environment variables):
     BREVO_API_KEY       the API key from Brevo (SMTP & API > API keys)
     BREVO_SENDER_EMAIL  a sender address verified in Brevo

   Images load from the live site (images/email/), so they must stay there.
   ========================================================================== */

const SITE = "https://movewithmoehtx.com";
const PHONE = "(979) 888-8887";
const PHONE_LINK = "tel:+19798888887";

// Brand colors (css/global.css)
const TEAL = "#0A4651";
const TEAL_DARK = "#062F37";
const ACCENT = "#0E6070";
const YELLOW = "#E2E41D";
const INK = "#0B1F24";
const GRAY = "#4F5F63";
const MIST = "#EEF4F4";
const LINE = "#D9E3E4";

const HEADING = "'Bebas Neue', 'Arial Narrow', Impact, Arial, sans-serif";
const BODY = "Poppins, Arial, Helvetica, sans-serif";

const MESSAGES = {
    quote: {
        subject: "We got your quote request | Moe's Movers",
        what: "your quote request",
        footer: "You requested a moving quote on"
    },
    contact: {
        subject: "We got your message | Moe's Movers",
        what: "your message",
        footer: "You sent us a message on"
    }
};

const LABELS = {
    apartment: "Apartment", house: "House", townhouse: "Townhouse", condo: "Condo",
    storage: "Storage unit", office: "Office / commercial", "few-items": "A few items", other: "Other",
    "home-moves": "Home moves", "apartment-moves": "Apartment and condo moves",
    "commercial-moves": "Commercial and office moves", "packing-unpacking": "Packing and unpacking",
    "storage-moves": "Storage moves"
};

const escapeHtml = (text) =>
    String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const label = (value) => LABELS[value] || String(value).replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

const formatDate = (value) => {
    const date = new Date(`${value}T12:00:00`);
    return isNaN(date) ? value : date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

// The few details worth echoing back, so they can see we got it right
function summary(form, data) {
    const rows = [];
    if (form === "quote") {
        if (data.property_type) rows.push(["Moving", label(data.property_type)]);
        if (data.zip_from && data.zip_to) rows.push(["Route", `${data.zip_from} to ${data.zip_to}`]);
        if (data.move_date) rows.push(["Move date", formatDate(data.move_date)]);
    } else if (data.service) {
        rows.push(["Topic", label(data.service)]);
    }
    return rows;
}

function buildEmail(form, data) {
    const message = MESSAGES[form];
    const firstName = (data.first_name || data.name || "").trim().split(" ")[0] || "there";
    const name = escapeHtml(firstName);
    const rows = summary(form, data);

    const text =
        `Hi ${firstName},\n\n` +
        `Thanks for reaching out to Moe's Movers! We received ${message.what} and will get back to you shortly.\n\n` +
        rows.map(([k, v]) => `${k}: ${v}`).join("\n") + (rows.length ? "\n\n" : "") +
        `Need us sooner? Call us at ${PHONE}.\n\n` +
        `Talk soon,\nMoe\nFounder, Moe's Movers\n${SITE}`;

    const summaryHtml = rows.length
        ? `<tr><td style="padding:0 40px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${MIST};border-left:4px solid ${YELLOW};">
              ${rows.map(([k, v]) => `
              <tr>
                <td style="padding:10px 16px;font-family:${BODY};font-size:13px;color:${GRAY};width:110px;">${escapeHtml(k)}</td>
                <td style="padding:10px 16px 10px 0;font-family:${BODY};font-size:14px;font-weight:600;color:${INK};">${escapeHtml(v)}</td>
              </tr>`).join("")}
            </table>
          </td></tr>`
        : "";

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${escapeHtml(message.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${MIST};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${MIST};">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-collapse:collapse;">

      <!-- Header: teal band with the yellow logo -->
      <tr><td style="background:${TEAL};padding:28px 40px 24px;">
        <a href="${SITE}" style="text-decoration:none;"><img src="${SITE}/images/email/logo-yellow.png" width="200" alt="Move with Moe" style="display:block;width:200px;height:auto;border:0;"></a>
      </td></tr>
      <tr><td style="background:${YELLOW};height:6px;line-height:6px;font-size:0;">&nbsp;</td></tr>

      <!-- Message -->
      <tr><td style="padding:36px 40px 8px;">
        <p style="margin:0 0 6px;font-family:${BODY};font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};">Request received</p>
        <!-- Headline is an image so it shows in his Bebas Neue font in every inbox -->
        <h1 style="margin:0 0 20px;font-size:0;line-height:0;">
          <img src="${SITE}/images/email/headline-thanks.png" width="520" alt="Thanks for reaching out!" style="display:block;width:100%;max-width:520px;height:auto;border:0;font-family:${HEADING};font-size:36px;line-height:1;color:${INK};">
        </h1>
        <p style="margin:0 0 8px;font-family:${BODY};font-size:17px;line-height:1.5;font-weight:600;color:${INK};">Hi ${name},</p>
        <p style="margin:0 0 16px;font-family:${BODY};font-size:16px;line-height:1.65;color:${GRAY};">We received ${message.what} and will get back to you <strong style="color:${INK};">shortly</strong>.</p>
      </td></tr>
      ${summaryHtml}

      <!-- Call button -->
      <tr><td style="padding:20px 40px 8px;">
        <p style="margin:0 0 14px;font-family:${BODY};font-size:16px;line-height:1.65;color:${GRAY};">Need us sooner? Give us a call.</p>
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="background:${YELLOW};">
            <a href="${PHONE_LINK}" style="display:inline-block;padding:14px 28px;font-family:${BODY};font-size:16px;font-weight:600;color:${TEAL_DARK};text-decoration:none;">Call ${PHONE}</a>
          </td>
        </tr></table>
      </td></tr>

      <!-- Sign-off with Moe's photo -->
      <tr><td style="padding:28px 40px 36px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="border-top:1px solid ${LINE};width:100%;"><tr><td style="padding-top:24px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:16px;vertical-align:middle;">
              <img src="${SITE}/images/email/moe.jpg" width="72" height="72" alt="Moe" style="display:block;width:72px;height:72px;border-radius:50%;border:3px solid ${YELLOW};">
            </td>
            <td style="vertical-align:middle;font-family:${BODY};">
              <div style="font-size:15px;color:${GRAY};">Talk soon,</div>
              <div style="font-size:18px;line-height:1.3;font-weight:700;color:${INK};">Moe</div>
              <div style="font-size:13px;color:${ACCENT};font-weight:600;">Founder, Moe&rsquo;s Movers</div>
            </td>
          </tr></table>
        </td></tr></table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:${TEAL_DARK};padding:20px 40px;font-family:${BODY};font-size:12px;line-height:1.6;color:#C7D6D8;">
        <a href="${SITE}" style="color:${YELLOW};text-decoration:none;font-weight:600;">movewithmoehtx.com</a>
        &nbsp;&middot;&nbsp; ${message.footer} movewithmoehtx.com.<br>
        Licensed and insured &nbsp;&middot;&nbsp; TXDMV # 010005908C &nbsp;&middot;&nbsp; USDOT # 4288855
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

    return { subject: message.subject, html, text, firstName };
}

exports.buildEmail = buildEmail;

exports.handler = async (event) => {
    const { payload } = JSON.parse(event.body || "{}");
    if (!payload) return { statusCode: 200, body: "No payload" };

    const form = payload.form_name;
    const data = payload.data || {};
    const email = (data.email || "").trim();
    if (!MESSAGES[form] || !email) return { statusCode: 200, body: "Nothing to send" };

    const { BREVO_API_KEY, BREVO_SENDER_EMAIL } = process.env;
    if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL) {
        console.error("Missing BREVO_API_KEY or BREVO_SENDER_EMAIL");
        return { statusCode: 500, body: "Email not configured" };
    }

    const { subject, html, text, firstName } = buildEmail(form, data);

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": BREVO_API_KEY,
            "content-type": "application/json",
            accept: "application/json"
        },
        body: JSON.stringify({
            sender: { name: "Moe's Movers", email: BREVO_SENDER_EMAIL },
            replyTo: { email: BREVO_SENDER_EMAIL, name: "Moe's Movers" },
            to: [{ email, name: firstName }],
            subject,
            htmlContent: html,
            textContent: text
        })
    });

    if (!response.ok) {
        console.error("Brevo error", response.status, await response.text());
        return { statusCode: 502, body: "Email failed" };
    }
    return { statusCode: 200, body: "Sent" };
};
