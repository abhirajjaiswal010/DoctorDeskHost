import { NextResponse } from "next/server";
import { updatePhonePeStatus } from "@/actions/payment";
import { checkPaymentStatus } from "@/actions/phonepe";

// Handle PhonePe Redirect (POST)
export async function POST(req) {
  try {
    console.log("Payment Callback POST Received");
    const formData = await req.formData();
    
    // Log all form keys
    const dataObj = {};
    formData.forEach((value, key) => (dataObj[key] = value));
    console.log("Callback POST Data:", dataObj);

    // Check URL params first (since we embedded it), then form data
    const url = new URL(req.url); // Use standard URL object from Request
    const urlId = url.searchParams.get("id");

    const merchantTransactionId = 
      urlId || 
      formData.get("transactionId") || 
      formData.get("merchantTransactionId") || 
      formData.get("merchantOrderId");

    const code = formData.get("code");

    if (merchantTransactionId) {
      console.log(`Verifying Transaction ID: ${merchantTransactionId}`);
      const statusRes = await checkPaymentStatus(merchantTransactionId);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

      if (statusRes.success && (statusRes.status === "PAYMENT_SUCCESS" || statusRes.status === "COMPLETED")) {
        await updatePhonePeStatus(merchantTransactionId, "APPROVED");
        return NextResponse.redirect(new URL("/pricing?payment_status=success", baseUrl), 303);
      } else if (statusRes.success) {
         if (statusRes.status === "PAYMENT_PENDING") {
             return NextResponse.redirect(new URL("/pricing?payment_status=pending", baseUrl), 303);
         } else {
             await updatePhonePeStatus(merchantTransactionId, "REJECTED");
             const reason = statusRes.data?.code || "rejected";
             const state = statusRes.data?.data?.state || statusRes.data?.state || "unknown";
             return NextResponse.redirect(new URL(`/pricing?payment_status=failed&reason=${reason}&state=${state}`, baseUrl), 303);
         }
      }
    } else {
        console.error("Missing MerchantTransactionId in POST callback");
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    return NextResponse.redirect(new URL("/pricing?payment_status=failed&reason=verification_failed", baseUrl), 303);
  } catch (error) {
    console.error("Callback POST Error:", error);
    return NextResponse.redirect(new URL("/pricing?payment_status=error", req.url), 303);
  }
}

// Handle PhonePe Redirect (GET) if configured or fallback
export async function GET(req) {
  try {
    console.log("Payment Callback GET Received");
    const { searchParams } = new URL(req.url);
    
    // Log params for debugging
    const paramsObj = {};
    searchParams.forEach((value, key) => (paramsObj[key] = value));
    console.log("Callback GET Params:", paramsObj);

    // Some gateways send 'transactionId', 'id', or 'merchantTransactionId'
    const merchantTransactionId = searchParams.get("id") || searchParams.get("merchantTransactionId") || searchParams.get("transactionId") || searchParams.get("merchantOrderId");
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    if (merchantTransactionId) {
      const statusRes = await checkPaymentStatus(merchantTransactionId);

      if (statusRes.success && (statusRes.status === "PAYMENT_SUCCESS" || statusRes.status === "COMPLETED")) {
        await updatePhonePeStatus(merchantTransactionId, "APPROVED");
        return NextResponse.redirect(new URL("/pricing?payment_status=success", baseUrl), 303);
      } else if (statusRes.success && statusRes.status === "PAYMENT_PENDING") {
         return NextResponse.redirect(new URL("/pricing?payment_status=pending", baseUrl), 303);
      } else {
         await updatePhonePeStatus(merchantTransactionId, "REJECTED");
         const reason = statusRes.data?.code || "rejected";
         const state = statusRes.data?.data?.state || statusRes.data?.state || "unknown";
         return NextResponse.redirect(new URL(`/pricing?payment_status=failed&reason=${reason}&state=${state}`, baseUrl), 303);
      }
    }
    
    console.error("Missing MerchantTransactionId in GET callback");
    return NextResponse.redirect(new URL("/pricing?payment_status=failed&reason=missing_id", baseUrl), 303);
  } catch (error) {
    console.error("Callback GET Error:", error);
    return NextResponse.redirect(new URL("/pricing?payment_status=error", req.url), 303);
  }
}
