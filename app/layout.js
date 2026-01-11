import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import Footer from "@/components/footer"; // ✅ ADD THIS
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
  description: "DoctorDesk is a secure scheduling and workflow platform for independent professionals.",
  icons: {
    icon: [
      {
        url: "/favicon-light.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/favicon-dark.png",
        media: "(prefers-color-scheme: light)",
      },
    ],
    shortcut: [
      {
        url: "/favicon-light.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/favicon-dark.png",
        media: "(prefers-color-scheme: light)",
      },
    ],
    apple: [
      {
        url: "/favicon-light.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
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
