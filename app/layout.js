import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import Footer from "@/components/footer";
import { ClerkProvider } from "@clerk/nextjs";
import { CreditsProvider } from "@/context/CreditsContext";
import Script from "next/script";
import { checkUser } from "@/lib/checkUser";
import PageLoader from "@/components/PageLoader";
import { Toaster } from "sonner";
import WhatsAppButton from "@/components/WhatsAppButton";
import PaymentToast from "@/components/payment-toast";

const inter = Poppins({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

export const metadata = {
  title: "DoctorDesk",
  description:
    "DoctorDesk is a secure scheduling and workflow platform for independent professionals.",
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

          {/* 🔥 Google Analytics */}
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-GXCHKJRJ01"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-GXCHKJRJ01');
            `}
          </Script>

          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <CreditsProvider initialCredits={0}>
              <PageLoader>
                <Header user={user} />

                <Toaster richColors position="top-center" />

                <main className="min-h-screen">{children}</main>

                <Footer />
                <WhatsAppButton />
                <PaymentToast />
              </PageLoader>
            </CreditsProvider>
          </ThemeProvider>

          {/* Razorpay Checkout Script */}
        </body>
      </html>
    </ClerkProvider>
  );
}