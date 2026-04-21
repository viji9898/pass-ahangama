import crypto from "crypto";
import { neon } from "@neondatabase/serverless";
import sgMail from "@sendgrid/mail";

const sql = neon(process.env.NETLIFY_DATABASE_URL);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const COMP_PROMO_CODE = "PASS100";
const PASS_OPTIONS = {
  comp_7: {
    label: "Complimentary Pass (1 Week)",
    days: 7,
  },
  comp_14: {
    label: "Complimentary Pass (2 Weeks)",
    days: 14,
  },
  comp_30: {
    label: "Complimentary Pass (1 Month)",
    days: 30,
  },
};

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseYmdToUtcDate(ymd) {
  if (typeof ymd !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function getUtcTodayStart() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function validateStartDate(startDate) {
  const parsedStartDate = parseYmdToUtcDate(startDate);
  if (!parsedStartDate) return "Invalid start date";

  const minDate = getUtcTodayStart();
  const maxDate = new Date(minDate);
  maxDate.setUTCDate(maxDate.getUTCDate() + 60);

  if (parsedStartDate < minDate || parsedStartDate > maxDate) {
    return "Start date out of allowed range";
  }

  return null;
}

function buildExpiryDate(startDate, validityDays) {
  const parsedStartDate = parseYmdToUtcDate(startDate);
  if (!parsedStartDate) return null;

  const expiryDate = new Date(parsedStartDate);
  expiryDate.setUTCDate(expiryDate.getUTCDate() + validityDays - 1);
  expiryDate.setUTCHours(18, 29, 59, 999);
  return expiryDate;
}

function generatePassCode(seed, length = 12) {
  return crypto
    .createHash("sha256")
    .update(seed)
    .digest("hex")
    .slice(0, length);
}

function toColomboIsoString(date) {
  const offsetMs = 5.5 * 60 * 60 * 1000;
  const local = new Date(date.getTime() + offsetMs);
  const pad = (value) => String(value).padStart(2, "0");

  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}+05:30`;
}

async function createSmartPassLink({
  passHolderName,
  customerEmail,
  customerPhone,
  passkitPassId,
  expiryDate,
}) {
  const apiUrl = "https://api.pub1.passkit.io/distribution/smartpasslink";
  const smartPassSecret = process.env.PASSKIT_SMARTPASS_SECRET;

  if (!smartPassSecret) {
    throw new Error("PASSKIT_SMARTPASS_SECRET is missing");
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${smartPassSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectDistributionUrl: {
        url: "https://pub1.pskt.io/c/5cb4m9",
        title: "Ahangama Pass",
      },
      fields: {
        "members.program.name": "Ahangama Pass 2026",
        "members.member.points": "120",
        "members.tier.name": "Base",
        "members.member.status": "ACTIVE",
        "members.member.externalId": `https://pass.ahangama.com/v?id=${passkitPassId}`,
        "person.displayName": passHolderName,
        "person.surname": "",
        "person.emailAddress": customerEmail,
        "person.mobileNumber": customerPhone,
        "universal.info": "Valid at all participating Ahangama Pass venues.",
        "universal.expiryDate": toColomboIsoString(expiryDate),
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PassKit request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data?.url || null;
}

async function sendCompPassEmail({
  customerEmail,
  passHolderName,
  smartLinkUrl,
  passLabel,
  startDate,
  expiryDate,
  passkitPassId,
}) {
  const msg = {
    to: customerEmail,
    from: "hello@ahangama.com",
    subject: "Your Complimentary Ahangama Pass is Ready",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B4513, #D2691E); color: white; padding: 28px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #ddd; }
          .card { background: #f8f3ee; border-radius: 10px; padding: 18px; margin: 20px 0; }
          .button { display: inline-block; background: #D2691E; color: white; padding: 12px 22px; text-decoration: none; border-radius: 8px; margin-top: 12px; }
          .footer { background: #f5f5f5; padding: 18px; text-align: center; border-radius: 0 0 12px 12px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Complimentary Pass Is Ready</h1>
            <p>Welcome to Ahangama Pass</p>
          </div>
          <div class="content">
            <p>Dear ${passHolderName},</p>
            <p>Your complimentary Ahangama Pass has been issued successfully.</p>
            <div class="card">
              <strong>Pass Type:</strong> ${passLabel}<br />
              <strong>Valid From:</strong> ${new Date(startDate).toLocaleDateString()}<br />
              <strong>Valid Until:</strong> ${new Date(expiryDate).toLocaleDateString()}<br />
              <strong>Pass ID:</strong> ${passkitPassId}
            </div>
            <p>Use the digital pass link below to access your pass.</p>
            <p><a class="button" href="${smartLinkUrl}">Open Digital Pass</a></p>
            <p>See the full Ahangama Pass venue list on Google Maps: <a href="https://maps.app.goo.gl/WtHWoZXyC9mT4q8r6">View all participating places</a>.</p>
            <p>Participating venues and support are available at <a href="https://ahangama.com">ahangama.com</a>.</p>
          </div>
          <div class="footer">
            <p>© 2026 Ahangama Pass</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await sgMail.send(msg);
}

export default async (req) => {
  try {
    if (req.method !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const {
      passType,
      startDate,
      promoCode,
      passHolderName,
      customerEmail,
      customerPhone,
    } = await req.json();

    const selectedPass = PASS_OPTIONS[passType];
    if (!selectedPass) return json(400, { error: "Invalid pass option" });
    if (promoCode !== COMP_PROMO_CODE) {
      return json(400, { error: "Promo code is invalid" });
    }
    if (!passHolderName || typeof passHolderName !== "string") {
      return json(400, { error: "Pass holder name is required" });
    }
    if (!customerPhone || typeof customerPhone !== "string") {
      return json(400, { error: "Phone number is required" });
    }
    if (!isValidEmail(customerEmail)) {
      return json(400, { error: "A valid email address is required" });
    }

    const startDateError = validateStartDate(startDate);
    if (startDateError) return json(400, { error: startDateError });

    const issueId = `comp_${Date.now()}_${crypto.randomUUID()}`;
    const expiryDate = buildExpiryDate(startDate, selectedPass.days);
    const passkitPassId = generatePassCode(issueId);
    const smartLinkUrl = await createSmartPassLink({
      passHolderName: passHolderName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      passkitPassId,
      expiryDate,
    });

    await sql`
      INSERT INTO purchases (
        stripe_session_id,
        customer_email,
        customer_phone,
        pass_type,
        price_usd,
        start_date,
        expiry_date,
        status,
        passkit_pass_id,
        smart_link_url,
        pass_holder_name,
        receipt_url
      ) VALUES (
        ${issueId},
        ${customerEmail.trim()},
        ${customerPhone.trim()},
        ${passType},
        ${"0.00"},
        ${startDate},
        ${expiryDate.toISOString()},
        ${"issued"},
        ${passkitPassId},
        ${smartLinkUrl},
        ${passHolderName.trim()},
        ${null}
      )
    `;

    await sendCompPassEmail({
      customerEmail: customerEmail.trim(),
      passHolderName: passHolderName.trim(),
      smartLinkUrl,
      passLabel: selectedPass.label,
      startDate,
      expiryDate: expiryDate.toISOString(),
      passkitPassId,
    });

    await sql`
      UPDATE purchases
      SET email_sent_at = NOW()
      WHERE stripe_session_id = ${issueId}
    `;

    return json(200, {
      id: issueId,
      passType,
      passLabel: selectedPass.label,
      startDate,
      expiryDate: expiryDate.toISOString(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      passHolderName: passHolderName.trim(),
      passkitPassId,
      smartLinkUrl,
    });
  } catch (error) {
    console.error("issue-comp-pass error:", error);
    return json(500, { error: error.message || "Unknown error" });
  }
};
