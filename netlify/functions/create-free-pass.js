import crypto from "crypto";
import { neon } from "@neondatabase/serverless";
import sgMail from "@sendgrid/mail";

const sql = neon(process.env.NETLIFY_DATABASE_URL);

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const GUIDE_URL = "https://guide.ahangama.com";
const FREE_PASS = {
  passType: "free_30",
  label: "Ahangama Pass (Free)",
  days: 30,
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
  maxDate.setUTCDate(maxDate.getUTCDate() + 7);

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
  const smartPassSecret =
    process.env.PASSKIT_SMARTPASS_SECRET || process.env.SMARTPASS_SECRET;

  if (!smartPassSecret) {
    throw new Error("PASSKIT smart link secret is missing");
  }

  const response = await fetch(
    "https://api.pub1.passkit.io/distribution/smartpasslink",
    {
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
          "universal.info": "Valid at participating Ahangama Pass venues.",
          "universal.expiryDate": toColomboIsoString(expiryDate),
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PassKit request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data?.url || null;
}

async function sendFreePassEmail({
  customerEmail,
  passHolderName,
  smartLinkUrl,
  startDate,
  expiryDate,
  passkitPassId,
}) {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error("SENDGRID_API_KEY is missing");
  }

  const msg = {
    to: customerEmail,
    from: "hello@ahangama.com",
    subject: "Your free Ahangama Pass is ready",
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
          .button-secondary { display: inline-block; background: #f3e2cf; color: #5f3719; padding: 12px 22px; text-decoration: none; border-radius: 8px; margin-top: 12px; margin-left: 10px; }
          .footer { background: #f5f5f5; padding: 18px; text-align: center; border-radius: 0 0 12px 12px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your free Ahangama Pass is ready</h1>
            <p>Perks, privileges, and the 2026/2027 guide</p>
          </div>
          <div class="content">
            <p>Dear ${passHolderName},</p>
            <p>Your free Ahangama Pass has been created successfully. You can start using it across participating venues in Ahangama right away.</p>
            <div class="card">
              <strong>Pass Type:</strong> ${FREE_PASS.label}<br />
              <strong>Valid From:</strong> ${new Date(startDate).toLocaleDateString()}<br />
              <strong>Valid Until:</strong> ${new Date(expiryDate).toLocaleDateString()}<br />
              <strong>Pass ID:</strong> ${passkitPassId}
            </div>
            <p>Open your digital pass below, and keep the guide handy for your 2026/2027 Ahangama planning.</p>
            <p>
              <a class="button" href="${smartLinkUrl}">Open Digital Pass</a>
              <a class="button-secondary" href="${GUIDE_URL}">Open Guide</a>
            </p>
            <p>Need to share it to WhatsApp? You can forward the smart pass link directly after opening it.</p>
            <p>See the full Ahangama Pass venue list on Google Maps: <a href="https://maps.app.goo.gl/WtHWoZXyC9mT4q8r6">View all participating places</a>.</p>
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

function normalizeName(firstName, lastName) {
  return [firstName, lastName].map((value) => value.trim()).filter(Boolean).join(" ");
}

export default async (req) => {
  try {
    if (req.method !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const { firstName, lastName, customerEmail, customerPhone, startDate } =
      await req.json();

    if (!firstName || typeof firstName !== "string") {
      return json(400, { error: "First name is required" });
    }
    if (!lastName || typeof lastName !== "string") {
      return json(400, { error: "Last name is required" });
    }
    if (!customerPhone || typeof customerPhone !== "string") {
      return json(400, { error: "WhatsApp mobile is required" });
    }
    if (!isValidEmail(customerEmail)) {
      return json(400, { error: "A valid email address is required" });
    }

    const startDateError = validateStartDate(startDate);
    if (startDateError) return json(400, { error: startDateError });

    const passHolderName = normalizeName(firstName, lastName);
    if (!passHolderName) {
      return json(400, { error: "Pass holder name is required" });
    }

    const issueId = `free_${Date.now()}_${crypto.randomUUID()}`;
    const expiryDate = buildExpiryDate(startDate, FREE_PASS.days);
    const passkitPassId = generatePassCode(issueId);
    const smartLinkUrl = await createSmartPassLink({
      passHolderName,
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
        ${FREE_PASS.passType},
        ${"0.00"},
        ${startDate},
        ${expiryDate.toISOString()},
        ${"issued"},
        ${passkitPassId},
        ${smartLinkUrl},
        ${passHolderName},
        ${null}
      )
    `;

    let emailSent = false;

    try {
      await sendFreePassEmail({
        customerEmail: customerEmail.trim(),
        passHolderName,
        smartLinkUrl,
        startDate,
        expiryDate: expiryDate.toISOString(),
        passkitPassId,
      });

      await sql`
        UPDATE purchases
        SET email_sent_at = NOW()
        WHERE stripe_session_id = ${issueId}
      `;

      emailSent = true;
    } catch (emailError) {
      console.error("create-free-pass email error:", emailError);
    }

    return json(200, {
      id: issueId,
      passType: FREE_PASS.passType,
      passLabel: FREE_PASS.label,
      startDate,
      expiryDate: expiryDate.toISOString(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      passHolderName,
      passkitPassId,
      smartLinkUrl,
      guideUrl: GUIDE_URL,
      emailSent,
    });
  } catch (error) {
    console.error("create-free-pass error:", error);
    return json(500, { error: error.message || "Unknown error" });
  }
};