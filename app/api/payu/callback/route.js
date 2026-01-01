import { NextResponse } from "next/server";
import { verifyHash } from "@/lib/payu";
import { db as prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const data = Object.fromEntries(formData.entries());

    const { txnid, status, amount, productinfo, firstname, email, hash } = data;

    // Verify Hash
    const calculatedHash = verifyHash(data);

    if (calculatedHash !== hash) {
        // Redirect to failure page with error
      return NextResponse.redirect(new URL(`/payment/failure?msg=Hash_Mismatch`, process.env.NEXT_PUBLIC_BASE_URL), { status: 303 });
    }

    if (status === "success") {
      const credits = parseInt(data.udf1); // Credits
      const clerkUserId = data.udf2; // This is Clerk ID

      if (clerkUserId && credits) {
        // Find user first to get internal ID
        const user = await prisma.user.findUnique({
            where: { clerkUserId: clerkUserId }
        });

        if (user) {
             await prisma.user.update({
              where: { id: user.id },
              data: { credits: { increment: credits } },
            });
    
            await prisma.creditTransaction.create({
                data: {
                    userId: user.id, // Use internal ID
                    amount: parseFloat(amount),
                    type: "CREDIT_PURCHASE",
                    transactionId: txnid,
                    packageId: productinfo,
                }
            });
        }
      }

      return NextResponse.redirect(new URL("/payment/success", process.env.NEXT_PUBLIC_BASE_URL), { status: 303 });
    } else {
        return NextResponse.redirect(new URL("/payment/failure", process.env.NEXT_PUBLIC_BASE_URL), { status: 303 });
    }

  } catch (error) {
    console.error("PayU Callback Error:", error);
    return NextResponse.redirect(new URL("/payment/failure", process.env.NEXT_PUBLIC_BASE_URL), { status: 303 });
  }
}
