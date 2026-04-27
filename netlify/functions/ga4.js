const measurementId = process.env.GA4_MEASUREMENT_ID || "";
const apiSecret = process.env.GA4_API_SECRET || "";

export async function sendGa4PurchaseEvent({ clientId, params }) {
  if (!measurementId || !apiSecret) {
    return {
      configured: false,
      sent: false,
      retryable: false,
    };
  }

  if (!clientId || !params?.transaction_id) {
    return {
      configured: true,
      sent: false,
      retryable: false,
    };
  }

  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          events: [
            {
              name: "purchase",
              params,
            },
          ],
        }),
      },
    );

    if (response.ok) {
      return {
        configured: true,
        sent: true,
        retryable: false,
      };
    }

    return {
      configured: true,
      sent: false,
      retryable: response.status >= 500,
    };
  } catch {
    return {
      configured: true,
      sent: false,
      retryable: true,
    };
  }
}