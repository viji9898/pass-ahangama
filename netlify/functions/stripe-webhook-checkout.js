import Stripe from "stripe";
import sgMail from "@sendgrid/mail";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY ||
    (process.env.NODE_ENV === "development"
      ? process.env.STRIPE_SECRET_KEY_TEST
      : process.env.STRIPE_SECRET_KEY_LIVE),
);

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const money = (amount, currency) => {
  if (typeof amount !== "number") return "Unknown";
  return `${(amount / 100).toFixed(2)} ${currency?.toUpperCase() || ""}`.trim();
};

const formatAddress = (address) => {
  if (!address) return "Not provided";
  return [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
};

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
      const customerPhone = session.customer_details?.phone || "Not provided";
      const billingAddress = formatAddress(session.customer_details?.address);

      const amountSubtotal = money(session.amount_subtotal, session.currency);
      const amountTotal = money(session.amount_total, session.currency);

      const createdAt = session.created
        ? new Date(session.created * 1000).toISOString()
        : "Unknown";

      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id,
        {
          limit: 10,
        },
      );

      const products = lineItems.data.map((item) => ({
        description: item.description || "Unnamed item",
        quantity: item.quantity || 1,
        total: money(item.amount_total, session.currency),
      }));

      const productsText = products.length
        ? products
            .map(
              (product, index) =>
                `${index + 1}. ${product.description} x ${product.quantity} - ${product.total}`,
            )
            .join("\n")
        : "No line items found";

      const productsHtml = products.length
        ? `<ul>${products
            .map(
              (product) =>
                `<li>${product.description} × ${product.quantity} - ${product.total}</li>`,
            )
            .join("")}</ul>`
        : "<p>No line items found</p>";

      let paymentIntentId = session.payment_intent || "Not available";
      let chargeId = "Not available";
      let receiptUrl = "Not available";
      let cardSummary = "Not available";

      if (session.payment_intent) {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          session.payment_intent,
          { expand: ["latest_charge"] },
        );

        paymentIntentId = paymentIntent.id || paymentIntentId;

        const charge = paymentIntent.latest_charge;
        if (charge && typeof charge === "object") {
          chargeId = charge.id || "Not available";
          receiptUrl = charge.receipt_url || "Not available";

          const brand = charge.payment_method_details?.card?.brand;
          const last4 = charge.payment_method_details?.card?.last4;
          if (brand || last4) {
            cardSummary =
              `${brand || "card"} ${last4 ? `•••• ${last4}` : ""}`.trim();
          }
        }
      }

      const metadata = session.metadata || {};
      const clientReferenceId = session.client_reference_id || "Not provided";
      const customerId = session.customer || "Not available";
      const invoiceId = session.invoice || "Not available";
      const livemode = session.livemode ? "Live" : "Test";

      await sgMail.send({
        to: ["team@ahangama.com", "accounts@viji.com"],
        from: "hello@ahangama.com",
        subject: `New Stripe payment received - ${products[0]?.description || amountTotal}`,
        text: `
A new Stripe payment was made.

Customer
Name: ${customerName}
Email: ${customerEmail}
Phone: ${customerPhone}
Billing Address: ${billingAddress}

Order
Products:
${productsText}

Subtotal: ${amountSubtotal}
Total: ${amountTotal}
Currency: ${session.currency?.toUpperCase() || "Unknown"}
Payment Status: ${session.payment_status}
Mode: ${livemode}
Created: ${createdAt}

Stripe References
Session ID: ${session.id}
Customer ID: ${customerId}
Payment Intent ID: ${paymentIntentId}
Charge ID: ${chargeId}
Invoice ID: ${invoiceId}
Client Reference ID: ${clientReferenceId}

Payment Method
Card: ${cardSummary}
Receipt URL: ${receiptUrl}

Metadata
${Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : "No metadata"}
        `.trim(),
        html: `
          <h2>New Stripe payment received</h2>

          <h3>Customer</h3>
          <p><strong>Name:</strong> ${customerName}</p>
          <p><strong>Email:</strong> ${customerEmail}</p>
          <p><strong>Phone:</strong> ${customerPhone}</p>
          <p><strong>Billing Address:</strong> ${billingAddress}</p>

          <h3>Order</h3>
          <p><strong>Products:</strong></p>
          ${productsHtml}
          <p><strong>Subtotal:</strong> ${amountSubtotal}</p>
          <p><strong>Total:</strong> ${amountTotal}</p>
          <p><strong>Currency:</strong> ${session.currency?.toUpperCase() || "Unknown"}</p>
          <p><strong>Payment Status:</strong> ${session.payment_status}</p>
          <p><strong>Mode:</strong> ${livemode}</p>
          <p><strong>Created:</strong> ${createdAt}</p>

          <h3>Stripe References</h3>
          <p><strong>Session ID:</strong> ${session.id}</p>
          <p><strong>Customer ID:</strong> ${customerId}</p>
          <p><strong>Payment Intent ID:</strong> ${paymentIntentId}</p>
          <p><strong>Charge ID:</strong> ${chargeId}</p>
          <p><strong>Invoice ID:</strong> ${invoiceId}</p>
          <p><strong>Client Reference ID:</strong> ${clientReferenceId}</p>

          <h3>Payment Method</h3>
          <p><strong>Card:</strong> ${cardSummary}</p>
          <p><strong>Receipt URL:</strong> ${
            receiptUrl !== "Not available"
              ? `<a href="${receiptUrl}">View receipt</a>`
              : "Not available"
          }</p>

          <h3>Metadata</h3>
          <pre>${Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : "No metadata"}</pre>
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
