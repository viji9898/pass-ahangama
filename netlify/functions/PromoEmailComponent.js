import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function formatColomboDate(dateValue) {
  if (!dateValue) return "-";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: process.env.PROMO_TIMEZONE || "Asia/Colombo",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateValue));
}

function subtractUtcDays(dateValue, days) {
  const date = new Date(dateValue);
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

async function sendPromoTrialEmail({
  customerEmail,
  passHolderName,
  smartLinkUrl,
  passkitPassId,
  startDate,
  trialEndAt,
  paidStartAt,
  paidEndAt,
}) {
  const subject = "Your Ahangama Promo Trial Is Active";
  const html = `
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
            <h1>Your Promo Trial Is Live</h1>
            <p>Ahangama Pass Promo</p>
          </div>
          <div class="content">
            <p>Dear ${passHolderName || "Ahangama Pass Guest"},</p>
            <p>Your 5-day promo trial is active and your digital pass is ready to use.</p>
            <div class="card">
              <strong>Trial Starts:</strong> ${formatColomboDate(startDate)}<br />
              <strong>Trial Ends:</strong> ${formatColomboDate(subtractUtcDays(trialEndAt, 1))}<br />
              <strong>First Charge Date:</strong> ${formatColomboDate(paidStartAt)}<br />
              <strong>Paid Access Until:</strong> ${formatColomboDate(paidEndAt)}<br />
              <strong>Promo Pass ID:</strong> ${passkitPassId || "-"}
            </div>
            <p>Open your pass below and keep this email for reference.</p>
            <p><a class="button" href="${smartLinkUrl}">Open Promo Pass</a></p>
          </div>
          <div class="footer">
            <p>Questions? Visit <a href="https://ahangama.com">ahangama.com</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sgMail.send({
    to: customerEmail,
    from: "hello@ahangama.com",
    subject,
    html,
  });
}

async function sendPromoPaidEmail({
  customerEmail,
  passHolderName,
  smartLinkUrl,
  passkitPassId,
  paidStartAt,
  paidEndAt,
  receiptUrl,
}) {
  const subject = "Your Ahangama Promo Payment Was Successful";
  const html = `
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
          .button-secondary { display: inline-block; background: #2f855a; color: white; padding: 12px 22px; text-decoration: none; border-radius: 8px; margin-top: 12px; margin-left: 12px; }
          .footer { background: #f5f5f5; padding: 18px; text-align: center; border-radius: 0 0 12px 12px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Promo Payment Was Successful</h1>
            <p>Ahangama Pass Promo</p>
          </div>
          <div class="content">
            <p>Dear ${passHolderName || "Ahangama Pass Guest"},</p>
            <p>Your promo payment has been collected successfully.</p>
            <div class="card">
              <strong>Paid Access Starts:</strong> ${formatColomboDate(paidStartAt)}<br />
              <strong>Paid Access Ends:</strong> ${formatColomboDate(paidEndAt)}<br />
              <strong>Promo Pass ID:</strong> ${passkitPassId || "-"}
            </div>
            <p>
              <a class="button" href="${smartLinkUrl}">Open Promo Pass</a>
              ${receiptUrl ? `<a class="button-secondary" href="${receiptUrl}">View Receipt</a>` : ""}
            </p>
          </div>
          <div class="footer">
            <p>Questions? Visit <a href="https://ahangama.com">ahangama.com</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sgMail.send({
    to: customerEmail,
    from: "hello@ahangama.com",
    subject,
    html,
  });
}

export { sendPromoTrialEmail, sendPromoPaidEmail };
