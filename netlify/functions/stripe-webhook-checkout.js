import Stripe from "stripe";
import sgMail from "@sendgrid/mail";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY ||
    (process.env.NODE_ENV === "development"
      ? process.env.STRIPE_SECRET_KEY_TEST
      : process.env.STRIPE_SECRET_KEY_LIVE),
);

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const handler = async (event) => {
  const signature =
    event.headers["stripe-signature"] || event.headers["Stripe-Signature"];

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET_CHECKOUT,
    );
  } catch (err) {
    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`,
    };
  }

  try {
    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object;

      const customerEmail =
        session.customer_details?.email || "No customer email";
      const customerName = session.customer_details?.name || "No customer name";
      const amountTotal =
        typeof session.amount_total === "number"
          ? `${(session.amount_total / 100).toFixed(2)} ${session.currency?.toUpperCase()}`
          : "Unknown";

      await sgMail.send({
        to: ["team@ahangama.com", "accounts@viji.com"],
        from: "hello@ahangama.com",
        subject: "New Stripe payment received",
        text: `
A new payment was made.

Name: ${customerName}
Email: ${customerEmail}
Amount: ${amountTotal}
Session ID: ${session.id}
Payment Status: ${session.payment_status}
        `.trim(),
        html: `
          <h2>New Stripe payment received</h2>
          <p><strong>Name:</strong> ${customerName}</p>
          <p><strong>Email:</strong> ${customerEmail}</p>
          <p><strong>Amount:</strong> ${amountTotal}</p>
          <p><strong>Session ID:</strong> ${session.id}</p>
          <p><strong>Payment Status:</strong> ${session.payment_status}</p>
        `,
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: `Server Error: ${err.message}`,
    };
  }
};
