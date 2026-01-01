"use client";

import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function FailureContent() {
  const searchParams = useSearchParams();
  const errorMsg = searchParams.get("msg") || "Transaction failed";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <XCircle className="w-24 h-24 text-red-500 animate-pulse" />
      <h1 className="text-3xl font-bold text-red-700">Payment Failed</h1>
      <p className="text-muted-foreground max-w-md">
        We could not process your payment. <br />
        <span className="font-mono text-sm bg-muted p-1 rounded mt-2 inline-block">
          Error: {errorMsg}
        </span>
      </p>
      <div className="flex gap-4">
        <Link href="/pricing">
          <Button>Try Again</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

export default function PaymentFailure() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FailureContent />
    </Suspense>
  );
}
