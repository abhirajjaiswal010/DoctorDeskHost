"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Wallet, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useCredits } from "@/context/CreditsContext";
import { useAuth, useUser, SignInButton } from "@clerk/nextjs";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import { initiatePhonePePayment, checkPhonePeStatus, getUserPaymentHistory } from "@/actions/payment";
import { format } from "date-fns";

const plans = [
  { id: "BASIC", price: 300, credits: 1, currency: "INR" },
  { id: "STANDARD", price: 600, credits: 2, popular: true, currency: "INR" },
  { id: "PREMIUM", price: 900, credits: 3, currency: "INR" },
  // { id: "ENTERPRISE", price: 299, credits: 50, currency: "INR" },
];

function PaymentHistory({ refreshTrigger }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const res = await getUserPaymentHistory();
      if (res.success) {
        setHistory(res.data);
      }
      setLoading(false);
    };
    fetchHistory();
  }, [refreshTrigger]);

  if (loading) return <div className="mt-12 text-center text-sm text-muted-foreground">Loading history...</div>;
  if (history.length === 0) return null;

  return (
    <div className="mt-12 max-w-2xl mx-auto">
      <h3 className="text-lg font-semibold mb-4 text-center">Recent Payment Activity</h3>
      <div className="space-y-3">
        {history.map((item) => (
          <div key={item.id} className="bg-white border rounded-lg p-3 flex items-center justify-between shadow-sm">
            <div className="flex flex-col">
              <span className="font-medium text-sm">₹{item.amount} for {item.credits} Credits</span>
              {item.transactionId && <span className="text-xs font-mono text-muted-foreground">Transaction-Id : {item.transactionId}</span>}
              <span className="text-xs text-muted-foreground mt-0.5">Req: {format(new Date(item.createdAt), "MMM d, h:mm a")}</span>
              {item.processedAt && (
                <span className="text-xs text-green-600 mt-0.5 font-medium">
                  Approved: {format(new Date(item.processedAt), "MMM d, h:mm a")}
                </span>
              )}
            </div>
            <div>
              {item.status === "APPROVED" && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100 flex items-center gap-1"><Check className="w-3 h-3" /> Approved</span>}
              {item.status === "REJECTED" && <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">Rejected</span>}
              {item.status === "PENDING" && <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100 flex items-center gap-1"><Sparkles className="w-3 h-3 animate-pulse" /> Processing</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Pricing({ showHistory = true }) {
  const { credits, loading: creditsLoading, reloadCredits } = useCredits();
  const { isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const showWalletParam = searchParams?.get("showWallet") === "1";
  const showPanel = showWalletParam || pathname === "/pricing";
  const [isMobile, setIsMobile] = useState(false);

  // PhonePe Integration States
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Check for txnId in URL on load (Return from PhonePe)
  useEffect(() => {
    const txnId = searchParams.get("txnId");
    if (txnId) {
      verifyPaymentStatus(txnId);
    }
  }, [searchParams]);

  const verifyPaymentStatus = async (txnId) => {
    setIsVerifying(true);
    try {
      // Clear URL params first to avoid re-triggering
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);

      const res = await checkPhonePeStatus(txnId);

      if (res.success && res.status === "APPROVED") {
        toast.success("Payment Successful!", {
          description: "Credits have been added to your wallet.",
        });
        reloadCredits(); // Refresh context credits
      } else if (res.status === "PENDING") {
        toast.info("Payment Processing", {
          description: "Your payment is still processing. Please check back later.",
        });
      } else {
        toast.error("Payment Failed", {
          description: "Transaction was rejected or failed.",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error verifying payment");
    } finally {
      setIsVerifying(false);
    }
  };


  const handleBuy = async (plan) => {
    if (!isSignedIn) {
      toast.error("Please sign in first", {
        description: "Login is required to purchase credits",
      });
      return;
    }

    setProcessingPlanId(plan.id);

    try {
      // Use current window location as base for redirect
      // We will append txnId in the server action, so just pass pure URL
      const redirectUrl = window.location.href.split('?')[0];

      const res = await initiatePhonePePayment({
        amount: plan.price,
        credits: plan.credits,
        packageId: plan.id,
        redirectUrl: redirectUrl
      });

      if (res.success && res.url) {
        toast.loading("Redirecting to Payment Gateway...");
        window.location.href = res.url;
      } else {
        toast.error("Failed to initiate payment", {
          description: res.error || "Please try again later."
        });
        setProcessingPlanId(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
      setProcessingPlanId(null);
    }
  };

  return (
    <div className="mt-14 ">
      {/* Verifying Overlay */}
      {isVerifying && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <div className="text-center">
              <h3 className="text-lg font-bold">Verifying Payment...</h3>
              <p className="text-sm text-muted-foreground">Please do not close this window.</p>
            </div>
          </div>
        </div>
      )}

      {showPanel && (isSignedIn || showWalletParam) && (
        <div className="mb-6 flex items-center justify-center">
          <div className="
            flex items-center gap-3 px-4 py-2
            rounded-full
            bg-white
            border border-[#6ba49f]/30
            shadow-sm
          ">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#6ba49f]/10">
              <Wallet className="w-5 h-5 text-[#6ba49f]" />
            </div>

            <div className="text-sm leading-tight">
              <p className="text-slate-600 font-medium">Wallet Balance</p>
              {isSignedIn ? (
                <p className="font-bold text-slate-800">
                  {creditsLoading ? "..." : `${credits} credits`}
                </p>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-slate-800">
                    Sign in to view balance
                  </p>
                  <SignInButton
                    mode="modal"
                    forceRedirectUrl="/pricing?showWallet=1"
                    fallbackRedirectUrl="/pricing?showWallet=1"
                  >
                    <Button size="sm" className="bg-client text-white">
                      Sign in
                    </Button>
                  </SignInButton>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isMobile ? (
        // 🔹 Mobile: Swiper
        <Swiper
          modules={[Pagination]}
          pagination={{ clickable: true }}
          spaceBetween={16}
          slidesPerView={1.1}
          className="pb-10"
        >
          {plans.map((plan) => (
            <SwiperSlide key={plan.id}>
              <PricingCard
                plan={plan}
                isSignedIn={isSignedIn}
                handleBuy={handleBuy}
                loading={processingPlanId}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        // 🔹 Desktop: Grid
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <PricingCard
              plan={plan}
              key={plan.id}
              isSignedIn={isSignedIn}
              handleBuy={handleBuy}
              loading={processingPlanId}
            />
          ))}
        </div>
      )}

      {/* Payment History Section */}
      {isSignedIn && showHistory && <PaymentHistory refreshTrigger={isVerifying} />}

    </div>
  );
}

function PricingCard({ plan, isSignedIn, handleBuy, loading }) {
  const isLoading = loading === plan.id;

  return (
    <Card
      className={`relative border-2 transition-all duration-300
        hover:-translate-y-2 hover:shadow-xl
        ${plan.popular
          ? "border-[#6ba49f] shadow-[#6ba49f]/30"
          : "border-[#6ba49f]/30 hover:border-[#6ba49f]"
        }`}
    >
      {plan.popular && (
        <span className="absolute top-4 right-4 flex items-center gap-1 bg-[#6ba49f] text-white text-xs px-3 py-1 rounded-full">
          <Sparkles className="h-3 w-3" /> Most Popular
        </span>
      )}

      <CardHeader className="text-center">
        <CardTitle className="text-xl">{plan.id}</CardTitle>
        <p className="text-4xl font-extrabold mt-2">₹{plan.price}</p>
      </CardHeader>

      <CardContent className="space-y-4 text-center">
        <div className="flex justify-center items-center gap-2 text-muted-foreground">
          <Check className="h-4 w-4 text-[#6ba49f]" />
          {plan.credits} Credits
        </div>

        {isSignedIn ? (
          <Button
            onClick={() => handleBuy(plan)}
            disabled={!!loading}
            className={`w-full btn-shine text-white ${plan.popular
              ? "bg-[#6ba49f] hover:bg-[#6ba49f]/90"
              : "bg-[#6ba49f]/90 hover:bg-[#6ba49f]"
              } ${isLoading ? 'opacity-80' : ''}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Buy ${plan.id}`
            )}
          </Button>
        ) : (
          <SignInButton
            mode="modal"
            forceRedirectUrl="/#pricing"
            fallbackRedirectUrl="/#pricing"
          >
            <Button
              className="w-full border-2 border-[#6ba49f] text-[#6ba49f]
                         hover:bg-[#6ba49f] hover:text-white transition"
            >
              Sign in to Buy
            </Button>
          </SignInButton>
        )}
      </CardContent>
    </Card>
  );
}
