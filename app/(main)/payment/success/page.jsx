"use client";

import { useCredits } from "@/context/CreditsContext";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function PaymentSuccess() {
  const { setCredits } = useCredits();
  // We could parse query params if we want to show exact credits added, 
  // but simpler to just say "Success".
  // Ideally, the callback logic updated the DB.
  // The context might be stale until refresh or we fetch latest.
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <CheckCircle className="w-24 h-24 text-green-500 animate-bounce" />
      <h1 className="text-3xl font-bold text-green-700">Payment Successful!</h1>
      <p className="text-muted-foreground max-w-md">
        Your payment has been processed successfully and credits have been added to your account.
      </p>
      <div className="flex gap-4">
        <Link href="/">
          <Button>Go to Dashboard</Button>
        </Link>
        <Link href="/pricing">
          <Button variant="outline">Buy More</Button>
        </Link>
      </div>
    </div>
  );
}
