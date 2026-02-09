"use server";
// Triggering re-compilation

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

const MERCHANT_ID = "M237W6QSZFRUE_2602091909";
const SALT_KEY = "OWM4NDUwOWMtYTM5NS00ZWI1LTk4MGQtOGFkNWE3NzYxYzYz";
const SALT_INDEX = "1";

const PHONEPE_API_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";


// --- PhonePe Helper ---
function generateChecksum(payload, endpoint) {
  const data = payload + endpoint + SALT_KEY;
  const sha256 = crypto.createHash("sha256").update(data).digest("hex");
  return sha256 + "###" + SALT_INDEX;
}

// Initiate PhonePe Payment
export async function initiatePhonePePayment({ amount, credits, packageId, redirectUrl }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    
    if (!user) throw new Error("User not found");

    // Create unique transaction ID
    const transactionId = `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Store request in DB immediately as PENDING
    await db.paymentRequest.create({
      data: {
        user: { connect: { id: user.id } },
        amount: amount,
        credits: credits,
        paymentMethod: "PhonePe",
        packageId: packageId,
        transactionId: transactionId,
        status: "PENDING",
        // screenshotUrl is optional now
        credits: credits,
      }
    });

    // Append txnId to redirectUrl for frontend tracking on return
    const finalRedirectUrl = `${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}txnId=${transactionId}`;

    // Prepare PhonePe payload
    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: user.id,
      amount: amount * 100, // Amount in paise
      redirectUrl: finalRedirectUrl, // Where to redirect after payment
      redirectMode: "REDIRECT",
      callbackUrl: finalRedirectUrl, // Use same for callback in this simple flow (won't work on localhost but required field)
      mobileNumber: user.phone || "9999999999", // Fallback or use real
      paymentInstrument: {
        type: "PAY_PAGE"
      }
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
    const checksum = generateChecksum(base64Payload, "/pg/v1/pay");

    const response = await fetch(`${PHONEPE_API_URL}/pg/v1/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        accept: "application/json"
      },
      body: JSON.stringify({ request: base64Payload })
    });

    const data = await response.json();

    if (data.success) {
      return { 
        success: true, 
        url: data.data.instrumentResponse.redirectInfo.url,
        transactionId: transactionId 
      };
    } else {
      console.error("PhonePe Error:", data);
      return { success: false, error: data.message || "Payment initiation failed" };
    }

  } catch (error) {
    console.error("Error initiating payment:", error);
    return { success: false, error: error.message };
  }
}


// Check PhonePe Payment Status
export async function checkPhonePeStatus(transactionId) {
    const { userId } = await auth();
    // Allow public checking/webhook if needed, but for redirect flow, verify user usually.
    // However, status check might happen server-to-server without user context sometimes.
    // Let's keep strict auth for now since it's called from client side success page.
    
    try {
        const payloadStr = `/pg/v1/status/${MERCHANT_ID}/${transactionId}` + SALT_KEY;
        const checksum = crypto.createHash("sha256").update(payloadStr).digest("hex") + "###" + SALT_INDEX;

        const response = await fetch(`${PHONEPE_API_URL}/pg/v1/status/${MERCHANT_ID}/${transactionId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-VERIFY": checksum,
                "X-MERCHANT-ID": MERCHANT_ID,
            },
        });

        const data = await response.json();
        
        // Find existing request
        const request = await db.paymentRequest.findFirst({
            where: { transactionId: transactionId }
        });

        if (!request) return { success: false, error: "Request not found" };

        if (data.code === "PAYMENT_SUCCESS") {
            // Update status to APPROVED if not already
            if (request.status !== "APPROVED") {
                await db.$transaction(async (tx) => {
                    await tx.paymentRequest.update({
                        where: { id: request.id },
                        data: { 
                            status: "APPROVED",
                            processedAt: new Date(),
                            processedBy: "SYSTEM (PhonePe)"
                        }
                    });

                    // Add credits
                    await tx.user.update({
                        where: { id: request.userId },
                        data: { credits: { increment: request.credits } }
                    });

                    // Record transaction
                    await tx.creditTransaction.create({
                        data: {
                            userId: request.userId,
                            amount: request.credits,
                            type: "CREDIT_PURCHASE",
                            packageId: request.packageId,
                            transactionId: transactionId
                        }
                    });
                });
            }
            return { success: true, status: "APPROVED" };
        } else if (data.code === "PAYMENT_ERROR" || data.code === "PAYMENT_DECLINED") {
             await db.paymentRequest.update({
                where: { id: request.id },
                data: { status: "REJECTED" }
            });
            return { success: true, status: "REJECTED" };
        } else {
            return { success: true, status: "PENDING" };
        }

    } catch (error) {
        console.error("Error checking status:", error);
        return { success: false, error: error.message };
    }
}

// --- Legacy Handlers (Kept for admin manual process if needed, else updated) ---

// Create a new manual payment request
export async function createPaymentRequest(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  try {
     const user = await db.user.findUnique({
        where: { clerkUserId: userId },
     });
     
     if (!user) throw new Error("User not found");

     await db.paymentRequest.create({
       data: {
          user: { connect: { id: user.id } },
          amount: data.amount,
          credits: data.credits,
          screenshotUrl: data.screenshotUrl,
          transactionId: data.transactionId,
          paymentMethod: data.paymentMethod,
          packageId: data.packageId,
          status: "PENDING"
       }
     });
     
     return { success: true };
  } catch (error) {
    console.error("Error creating payment request:", error);
    return { success: false, error: error.message };
  }
}


// Get requests (Pending & History)
export async function getPaymentRequests() {
    const { userId } = await auth();
    
    const admin = await db.user.findUnique({
       where: { clerkUserId: userId },
    });

    if(admin?.role !== "ADMIN") throw new Error("Unauthorized");

    try {
        const pending = await db.paymentRequest.findMany({
            where: { status: "PENDING" },
            include: { user: true },
            orderBy: { createdAt: "desc" }
        });

        const history = await db.paymentRequest.findMany({
            where: { status: { in: ["APPROVED", "REJECTED"] } },
            include: { user: true },
            orderBy: { processedAt: "desc" },
            take: 50
        });

        return { success: true, requests: pending, history };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Verification mechanism (Admin Manual Approve)
export async function verifyPaymentRequest(requestId, status) {
    const { userId } = await auth();
     
    const admin = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if(admin?.role !== "ADMIN") throw new Error("Unauthorized");
     
     try {
        const request = await db.paymentRequest.findUnique({
            where: { id: requestId },
        });
        
        if (!request) throw new Error("Request not found");
        if (request.status !== "PENDING") throw new Error("Request already processed");
        
        await db.$transaction(async (tx) => {
            await tx.paymentRequest.update({
                where: { id: requestId },
                data: { 
                    status,
                    processedAt: new Date(),
                    processedBy: admin.name || admin.email || userId
                },
            });
            
            if (status === "APPROVED") {
                await tx.user.update({
                    where: { id: request.userId },
                    data: { credits: { increment: request.credits } },
                });
                
                await tx.creditTransaction.create({
                    data: {
                        userId: request.userId,
                        amount: request.credits,
                        type: "CREDIT_PURCHASE",
                        packageId: request.packageId,
                        transactionId: request.id
                    }
                });
            }
        });
        
        return { success: true };
     } catch (error) {
         console.error("Error verifying payment:", error);
         return { success: false, error: error.message };
     }
}

// Get current user's payment history
export async function getUserPaymentHistory() {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) return { success: false, error: "User not found" };

    const requests = await db.paymentRequest.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 10
    });

    return { success: true, data: requests };
  } catch (error) {
      console.error("Error fetching user history:", error);
      return { success: false, error: error.message };
  }
}

// Get unnotified approved payments for the current user
export async function getUnnotifiedPayments() {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) return { success: false, error: "User not found" };

    if (user.role !== "PATIENT") return { success: true, data: [] };

    const unnotified = await db.paymentRequest.findMany({
      where: {
        userId: user.id,
        status: "APPROVED",
        isNotified: false,
      },
    });

    return { success: true, data: unnotified };
  } catch (error) {
    console.error("Error fetching unnotified payments:", error);
    return { success: false, error: error.message };
  }
}

// Mark a payment as notified
export async function markPaymentAsNotified(paymentId) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    await db.paymentRequest.update({
      where: { id: paymentId },
      data: { isNotified: true },
    });
    return { success: true };
  } catch (error) {
    console.error("Error marking payment as notified:", error);
    return { success: false, error: error.message };
  }
}
