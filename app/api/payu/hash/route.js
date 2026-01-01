import { NextResponse } from "next/server";
import { generateHash } from "@/lib/payu";

export async function POST(req) {
  try {
    const body = await req.json();
    const { txnid, amount, productinfo, firstname, email, udf1, udf2 } = body;

    const hash = generateHash({ txnid, amount, productinfo, firstname, email, udf1, udf2 });

    return NextResponse.json({ hash });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
