// EmailComponent.js
// A reusable email sender for Ahangama Pass using SendGrid

import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Sends a styled Ahangama Pass email with purchase info
 * @param {Object} params - Email parameters
 * @param {string} params.customerEmail - Recipient email
 * @param {string} params.passHolderName - Name on pass
 * @param {string} params.smartLinkUrl - PassKit smart link
 * @param {string} params.passType - Pass type
 * @param {string} params.startDate - Start date (ISO)
 * @param {string} params.expiryDate - Expiry date (ISO)
 * @param {string} [params.receiptUrl] - Stripe receipt URL (optional)
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function sendAhangamaPassEmail({
  customerEmail,
  passHolderName,
  smartLinkUrl,
  passType,
  startDate,
  expiryDate,
  receiptUrl,
  passkitPassId,
}) {
  if (!customerEmail || !smartLinkUrl) {
    throw new Error("Missing required fields: customerEmail, smartLinkUrl");
  }

  const subject = "Your Ahangama Pass is Ready!";
  const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <style>
                body { font-family: 'Helvetica', Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #8B4513, #D2691E); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
                .content { background: #fff; padding: 30px; border: 1px solid #ddd; }
                .pass-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; font-family: monospace; font-size: 16px; border: 2px dashed #8B4513; }
                .footer { background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; font-size: 12px; color: #666; }
                .button { background: linear-gradient(135deg, #f7e6d4, #e5c7a0); color: #222; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 10px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>🎉 Welcome to Ahangama Pass!</h1>
                    <p>Your digital pass is ready</p>
                </div>
                <div class='content'>
                    <p>Dear ${passHolderName || "Valued Customer"},</p>
                    <p>🎊 <strong>Congratulations!</strong> Your Ahangama Pass purchase was successful.</p>
                    <div class='pass-info'>
                                                <div style='text-align:center;'>
                                                    <strong>Pass Type:</strong> ${passType || "Standard"}<br>
                                                    <strong>Valid From:</strong> ${startDate ? new Date(startDate).toLocaleDateString() : "-"}<br>
                                                    <strong>Valid Until:</strong> ${expiryDate ? new Date(expiryDate).toLocaleDateString() : "-"}<br>
                                                    ${passkitPassId ? `<div style='margin:16px 0;'><img src='https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`https://pass.ahangama.com/v?id=${passkitPassId}`)}' alt='QR Code' style='display:block;margin:0 auto 8px auto;' /></div>` : ""}
                                                    <strong>PassKit ID:</strong> ${passkitPassId || "-"}<br>
                                                    <div style='margin:16px 0;'>
                                                        <a href='${smartLinkUrl}' class='button'>📱 Digital Pass</a>
                                                        ${receiptUrl ? `<a href='${receiptUrl}' class='button' style='background: #28a745;'>🧾 View Receipt</a>` : ""}
                                                    </div>
                                                </div>
                    </div>
                    <p>Use your pass at all participating venues in Ahangama for exclusive benefits!</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='https://ahangama.com' class='button'>🗺️ View All Venues</a>
                        <a href='https://wa.me/94777908790?text=Hi!%20I%20need%20help%20with%20my%20Ahangama%20Pass.' class='button' style='background: #25d366; border-color: #25d366;'>💬 WhatsApp Support</a>
                    </div>
                    <p>Ready to explore Ahangama like a local? Your adventure starts now! 🌊</p>
                    <p>Happy exploring!<br><strong>The Ahangama Pass Team</strong></p>
                </div>
                <div class='footer'>
                    <p>Questions? Reply to this email or visit <a href='https://ahangama.com'>ahangama.com</a></p>
                    <p>© 2026 Ahangama Pass - Curated Local Experiences</p>
                    <p style='font-size: 10px; margin-top: 10px;'>This email was sent because you purchased an Ahangama Pass. Keep this email for your records.</p>
                </div>
            </div>
        </body>
        </html>
    `;

  const msg = {
    to: customerEmail,
    from: "hello@ahangama.com",
    subject,
    html: htmlBody,
  };

  await sgMail.send(msg);
  return { success: true, message: "Email sent successfully" };
}

export { sendAhangamaPassEmail };
