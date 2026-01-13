"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Wallet, Clock, Lock, Smartphone, Clipboard, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { useCredits } from "@/context/CreditsContext";
import { useAuth, useUser, SignInButton } from "@clerk/nextjs";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { createPaymentRequest, getUserPaymentHistory } from "@/actions/payment";
import { format } from "date-fns";

const plans = [
  { id: "BASIC", price: 300, credits: 1, currency: "INR" },
  { id: "STANDARD", price: 600, credits: 2, popular: true, currency: "INR" },
  { id: "PREMIUM", price: 900, credits: 3, currency: "INR" },
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

  if (loading) return null;
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
              {item.status === "PENDING" && <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100 flex items-center gap-1"><Sparkles className="w-3 h-3 animate-pulse" /> Verifying</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Pricing({ showHistory = true }) {
  const { credits, loading: creditsLoading } = useCredits();
  const { isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const showWalletParam = searchParams?.get("showWallet") === "1";
  const showPanel = showWalletParam || pathname === "/pricing";
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { user } = useUser();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // --- UPI CONFIGURATION ---
  const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || "Q024030615@ybl";
  const MERCHANT_NAME = process.env.NEXT_PUBLIC_MERCHANT_NAME || "Doctor Desk";

  const handleUPIPayment = () => {
    if (!selectedPlan) return;
    const note = `Payment for ${selectedPlan.credits} Credits by ${user?.fullName || 'User'}`;
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${selectedPlan.price}&cu=INR&tn=${encodeURIComponent(note)}`;
    window.location.href = upiLink;
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied!`);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const handleBuy = (plan) => {
    if (!isSignedIn) {
      toast.error("Please sign in first", {
        description: "Login is required to purchase credits",
      });
      return;
    }
    setSelectedPlan(plan);
    setScreenshotUrl("");
    setTransactionId("");
    setPaymentMethod("UPI");
    setIsSuccess(false);
    setIsDialogOpen(true);
  };

  const submitManualPayment = async () => {
    if (!transactionId) {
      toast.error("Please enter the transaction ID");
      return;
    }

    if (!screenshotUrl) {
      toast.error("Please upload the payment screenshot");
      return;
    }

    setIsSubmitLoading(true);
    try {
      const res = await createPaymentRequest({
        amount: selectedPlan.price,
        credits: selectedPlan.credits,
        screenshotUrl: screenshotUrl,
        transactionId: transactionId,
        paymentMethod: paymentMethod,
        packageId: selectedPlan.id,
      });

      if (res.success) {
        toast.success("Payment request submitted!", {
          description: "Admin will verify your payment and add credits shortly."
        });
        setIsSuccess(true);
      } else {
        toast.error("Failed to submit request", {
          description: res.error
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleWhatsAppRedirect = () => {
    const now = new Date();
    const dayName = format(now, 'EEEE'); // e.g., "Sunday"
    const fullDate = format(now, 'd MMMM yyyy'); // e.g., "12 January 2026"

    const message = `Hello,
I have successfully paid ₹${selectedPlan.price} for ${selectedPlan.credits} Credit${selectedPlan.credits > 1 ? 's' : ''} via ${paymentMethod}.
Transaction ID: ${transactionId || 'N/A'}
Name: ${user?.fullName || 'User'}
Date & Day: ${dayName}, ${fullDate}

Kindly confirm once received. Thank you.`;

    const url = `https://wa.me/918109424356?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    setIsDialogOpen(false);
  };

  return (
    <div className="mt-14 ">
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--client);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #5a8b87;
        }
      `}} />
      {/* Manual Payment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto custom-scrollbar">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-green-700">Payment Submitted!</h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Your request has been sent for verification. <br />
                <span className="font-semibold text-amber-600 block mt-1">Verification usually takes under 24 hours.</span>
                Send the proof on WhatsApp to speed up the process.
              </p>

              <Button
                onClick={handleWhatsAppRedirect}
                className="w-full bg-client hover:bg-client/80 text-white font-semibold mt-4"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" className="w-5 h-5 mr-2 brightness-0 invert" />
                Pay & Send Proof on WhatsApp
              </Button>

              <Button variant="ghost" className="text-xs text-muted-foreground" onClick={() => setIsDialogOpen(false)}>
                Skip & Close
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader className="space-y-0 ">
                <DialogTitle className="text-center text-xl">Complete Payment</DialogTitle>
                <DialogDescription className="text-center">
                  Scan the QR code to pay <span className="font-bold text-primary text-lg">₹{selectedPlan?.price}</span>
                </DialogDescription>

                {/* UPI Warning Alert */}
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md text-xs ">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                  <p>
                    <span className="font-bold">Note:</span> If "Pay via UPI" link fails, take a screenshot of this QR code and scan it from your UPI app.
                  </p>
                </div>
              </DialogHeader>

              <div className="flex flex-col items-center gap-6 py-2">
                {/* QR Code Section */}
                <div className="relative group">
                  <div className="w-56 h-56 bg-white p-2 rounded-xl border-2 shadow-sm flex items-center justify-center relative overflow-hidden">
                    <img
                      src="/qrDD.jpeg"
                      alt="Payment QR Code"
                      className="w-full h-full object-contain mix-blend-multiply"
                    />

                    {/* Center Logo - PhonePe Style */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="relative bg-gradient-to-br from-[#6ba49f] to-[#4a7873] opacity-90 rounded-full shadow-lg border-4 border-white">
                        <img
                          src="/final-logo.png"
                          alt="DoctorDesk Logo"
                          className="w-14 h-14 object-contain brightness-0 invert"
                        />
                      </div>
                    </div>

                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-lg" />
                  </div>
                  <div className="text-center mt-2 space-y-0">
                    {isMobile && (
                      <div className="pb-4">
                        <Button
                          onClick={handleUPIPayment}
                          className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                          <Smartphone className="w-5 h-5" />
                          Pay ₹{selectedPlan?.price} via UPI App
                        </Button>
                        {/* <p className="text-[10px] text-muted-foreground mt-2 font-medium">Auto-prefills Amount & Details</p> */}
                      </div>
                    )}
                    <p className="text-[13px] font-bold text-slate-800">Pay to: <span className="text-primary uppercase">{MERCHANT_NAME}</span></p>
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-[12px] font-semibold text-slate-600">UPI ID: <span className="text-primary select-all">{UPI_ID}</span></p>
                      <button onClick={() => copyToClipboard(UPI_ID, "UPI ID")} className="p-1 hover:bg-slate-100 rounded shadow-sm">
                        <Clipboard className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>
                    <div className="flex items-center justify-center gap-4 pt-1 opacity-60">
                      {/* <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" className="h-4 w-auto" /> */}
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/1024px-Google_Pay_Logo.svg.png?20221017164555" alt="GPay" className="h-4 w-auto" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" alt="Paytm" className="h-3 w-auto" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/UPI_logo.svg/330px-UPI_logo.svg.png" alt="UPI" className="h-2.5 w-auto" />
                    </div>
                  </div>
                </div>

                <div className="w-full space-y-2.5">
                  {[
                    isMobile ? "Click 'Pay via UPI App' above" : "Scan QR or pay using UPI ID",
                    "Complete payment & copy UTR",
                    "Upload payment screenshot",
                    "Enter Transaction ID below"
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-[11px] font-medium text-slate-600">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="w-full space-y-5 bg-card border-black p-4 rounded-lg border">
                  <div className="space-y-2">
                    <Label htmlFor="payment-method" className="text-xs font-semibold uppercase text-muted-foreground tracking-wider ml-1">
                      Payment Method <span className="text-red-500">*</span>
                    </Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger id="payment-method" className="bg-white">
                        <SelectValue placeholder="Select Payment Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UPI">UPI Sync</SelectItem>
                        <SelectItem value="GPay">GPay</SelectItem>
                        <SelectItem value="PhonePe">PhonePe</SelectItem>
                        <SelectItem value="Paytm">Paytm</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="txn-id" className="text-xs font-semibold uppercase text-muted-foreground tracking-wider ml-1">
                      Transaction ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="txn-id"
                      placeholder="Transaction ID"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="bg-white "
                      autoComplete="off"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider ml-1">
                      Payment Screenshot <span className="text-red-500">*</span>
                    </Label>
                    <CloudinaryUpload onUpload={setScreenshotUrl} />
                    {screenshotUrl && (
                      <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                        <span>✓ Screenshot uploaded</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-1">
                <Button type="button" variant="outline" className="border border-black" onClick={() => setIsDialogOpen(false)} disabled={isSubmitLoading}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={submitManualPayment}
                  disabled={isSubmitLoading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px]"
                >
                  {isSubmitLoading ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>


      {showPanel && (isSignedIn || showWalletParam) && (
        <div className="mb-6 flex items-center justify-center">
          <div
            className="
      flex items-center gap-3 px-4 py-2
      rounded-full
      bg-gradient-to-r from-yellow-100 to-yellow-200
      border border-yellow-300
      shadow-sm
    "
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-yellow-400/30">
              <Wallet className="w-5 h-5 text-yellow-700" />
            </div>

            <div className="text-sm leading-tight">
              <p className="text-yellow-700 font-medium">Wallet Balance</p>
              {isSignedIn ? (
                <p className="font-semibold text-yellow-900">
                  {creditsLoading ? "Loading..." : `${credits} credits`}
                </p>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-yellow-900">
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
                loading={null}
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
              loading={null}
            />
          ))}
        </div>
      )}

      {/* Payment History Section */}
      {isSignedIn && showHistory && <PaymentHistory refreshTrigger={isSuccess} />}

    </div>
  );
}

function PricingCard({ plan, isSignedIn, handleBuy, loading }) {
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
            disabled={loading === plan.id}
            className={`w-full btn-shine text-white ${plan.popular
              ? "bg-[#6ba49f] hover:bg-[#6ba49f]/90"
              : "bg-[#6ba49f]/90 hover:bg-[#6ba49f]"
              }`}
          >
            {loading === plan.id ? "Processing..." : `Buy ${plan.id}`}
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
