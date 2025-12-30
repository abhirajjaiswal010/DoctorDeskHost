
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import Footer from "@/components/footer"; // ✅ ADD THIS
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";

import { CreditsProvider } from "@/context/CreditsContext";
import Script from "next/script";
import { checkUser } from "@/lib/checkUser";
import PageLoader from "@/components/PageLoader";
import { Toaster } from "sonner";
import WhatsAppButton from "@/components/WhatsAppButton";

const inter = Poppins({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

export const metadata = {
  title: "DoctorDesk",
  description: "DoctorDesk is a powerful online healthcare platform in India designed for seamless online doctor appointment booking, online video consultations, digital prescriptions, and secure online patient management. DoctorDesk helps patients connect with verified doctors, manage medical records, and access online healthcare services anytime, anywhere",
};

export default async function RootLayout({ children }) {
  const user = await checkUser(); // server-side

  return (
    <ClerkProvider
      appearance={{
        theme: "simple",
        layout: {
          showLogo: false,
          logoImageUrl: null,
          logoText: "Medi-App",
          socialButtonsVariant: "none",
        },
        elements: {
          identityPreview: "hidden",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {/* 🔐 Credits Context */}
            <CreditsProvider initialCredits={0}>
             <PageLoader>
    {/* Header + Main + Footer sab loader ke andar */}
 
    <Header user={user} />
       <Toaster
    richColors
    position="top-center"
    />
    <main className="min-h-screen">{children}</main>
    <Footer />
    <WhatsAppButton />
  </PageLoader>

            </CreditsProvider>
          </ThemeProvider>

          {/* Razorpay Checkout Script */}
          <Script src="https://checkout.razorpay.com/v1/checkout.js" />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
