"use server";

let cachedToken = null;
let tokenExpiry = null;
let tokenType = "Bearer"; // Default to Bearer

const CLIENT_ID = process.env.PHONEPE_CLIENT_ID;
const CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET;
const CLIENT_VERSION = process.env.PHONEPE_CLIENT_VERSION || "1";
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const REDIRECT_URL = process.env.NEXT_PUBLIC_REDIRECT_URL;

const PHONEPE_ENV = process.env.PHONEPE_ENV || "sandbox";
const BASE_URL = PHONEPE_ENV === "production" 
  ? "https://api.phonepe.com/apis/hermes" 
  : "https://api-preprod.phonepe.com/apis/pg-sandbox"; 

// ================================
// 1️⃣ Get OAuth Token
// ================================
async function getAccessToken() {
  if (cachedToken && tokenExpiry && new Date() < new Date(tokenExpiry - 5 * 60 * 1000)) {
    return { token: cachedToken, type: tokenType };
  }

  // Matches user's working snippet
  const params = new URLSearchParams();
  params.append("client_id", CLIENT_ID);
  params.append("client_secret", CLIENT_SECRET);
  params.append("grant_type", "client_credentials");
  params.append("client_version", CLIENT_VERSION);

  console.log("Fetching PhonePe Token with params:", params.toString());

  const res = await fetch(`${BASE_URL}/v1/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("PhonePe Token Error:", txt);
    throw new Error(`Token Error: ${txt}`);
  }

  const data = await res.json();
  console.log("PhonePe Token Response:", JSON.stringify(data, null, 2));

  cachedToken = data.access_token;
  
  // Per docs: Depend on expires_at (epoch seconds)
  if (data.expires_at) {
    tokenExpiry = new Date(data.expires_at * 1000);
  } else {
    tokenExpiry = new Date(Date.now() + (data.expires_in || 3600) * 1000);
  }

  tokenType = data.token_type || "Bearer"; // Store the token type (e.g., O-Bearer)

  return { token: cachedToken, type: tokenType };
}

// ================================
// 2️⃣ Initiate Payment (Standard Checkout V2)
// ================================
export async function initiatePayment(amount, userId, planId) {
  try {
    const merchantOrderId = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const { token, type } = await getAccessToken();

    // Construct URL with ID to ensure we track it even if params are lost
    const redirectUrlWithId = `${REDIRECT_URL}?id=${merchantOrderId}`;

    const payload = {
      merchantId: MERCHANT_ID,
      merchantOrderId: merchantOrderId,
      merchantUserId: userId || "GUEST_USER", 
      amount: Math.round(amount * 100),
      redirectUrl: redirectUrlWithId,
      callbackUrl: redirectUrlWithId,
      mobileNumber: "9999999999",
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: "Payment for Credits" 
      }
    };

    console.log("Initiating Payment:", JSON.stringify(payload, null, 2));

    const res = await fetch(`${BASE_URL}/checkout/v2/pay`, {
      method: "POST",
      headers: {
        "Authorization": `${type} ${token}`, 
        "Content-Type": "application/json",
        "X-MERCHANT-ID": MERCHANT_ID
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("Payment Init Response:", JSON.stringify(data, null, 2));

    if (!res.ok) {
      throw new Error(data.message || JSON.stringify(data) || "Failed to initiate payment");
    }

    // Check for nested data structure first, then flat, then root level fallback
    const forwardUrl = data.data?.instrumentResponse?.redirectInfo?.url 
                    || data.instrumentResponse?.redirectInfo?.url
                    || data.redirectUrl; // Fallback for some Sandbox responses

    console.log("FORWARD URL:", forwardUrl);

    if (!forwardUrl) {
       // If still missing, log and throw
      throw new Error(`No redirect URL received. Full Response: ${JSON.stringify(data)}`);
    }

    return { success: true, url: forwardUrl, merchantTransactionId: merchantOrderId };
  } catch (error) {
    console.error("Payment Error:", error);
    return { success: false, error: error.message };
  }
}

// ================================
// 3️⃣ Check Payment Status
// ================================
export async function checkPaymentStatus(merchantTransactionId) {
  try {
    const { token, type } = await getAccessToken();

    const res = await fetch(`${BASE_URL}/checkout/v2/order/${merchantTransactionId}/status`, {
      headers: {
        "Authorization": `${type} ${token}`,
        "X-CLIENT-ID": CLIENT_ID,
        "X-CLIENT-VERSION": CLIENT_VERSION,
        "X-MERCHANT-ID": MERCHANT_ID
      }
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("Status Check Error:", txt);
      throw new Error(txt);
    }

    const data = await res.json();
    console.log("Payment Status Response:", JSON.stringify(data, null, 2));

    const code = data.code;
    const state = data.data?.state || data.state; // Check root level too

    if (code === "PAYMENT_SUCCESS" || state === "COMPLETED") {
        return { success: true, status: "PAYMENT_SUCCESS", data };
    }
    
    if (code === "PAYMENT_ERROR" || state === "FAILED") {
        return { success: true, status: "PAYMENT_FAILED", data };
    }

    if (code === "PAYMENT_PENDING" || state === "PENDING") {
        return { success: true, status: "PAYMENT_PENDING", data };
    }

    return { success: true, status: "PAYMENT_UNKNOWN", data };
  } catch (error) {
    console.error("Status Check Error:", error);
    return { success: false, error: error.message };
  }
}
