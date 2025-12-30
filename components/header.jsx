"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Calendar,
  CreditCard,
  Menu,
  Stethoscope,
  User,
  UserIcon,
} from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useCredits } from "@/context/CreditsContext";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export const Header = () => {
  const { user, role, isLoaded } = useCurrentUser();

  const [isMobile, setIsMobile] = useState(false);
  const { credits } = useCredits();
 
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background backdrop-blur">
      {isMobile ? (
        <MobileHeader user={user} />
      ) : (
        <DesktopHeader user={user} credits={credits} />
      )}
    </header>
  );
};

/* ================= MOBILE HEADER ================= */
const MobileHeader = ({ user }) => {
  const { credits } = useCredits();

  return (
    <div className="relative flex items-center h-16 px-2">
      {/* LEFT - Hamburger Menu */}
      <div className="absolute left-2">
        <MobileMenu user={user} />
      </div>

      {/* CENTER - Logo */}
      <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-1">
        <Link href="/" className="flex items-center gap-1">
          <Image src="/final-logo.png" width={40} height={40} alt="logo" />
          <span className="font-bold text-lg">
            Doctor<span className="text-client">Desk</span>
          </span>
        </Link>
      </div>

      {/* RIGHT - Credits + User */}
      <div className="absolute right-2 flex items-center gap-1">
        {user && (
          <Link href="/pricing">
            <Badge
              variant="outline"
              className="px-2 py-1 border-client text-client whitespace-nowrap flex items-center gap-1"
            >
              💳 {credits}
            </Badge>
          </Link>
        )}

        <SignedIn>
          <UserButton />
        </SignedIn>

        <SignedOut>
          <SignInButton forceRedirectUrl="/onboarding" fallbackRedirectUrl="/onboarding">
            <Button size="icon" variant="ghost">
              <UserIcon />
            </Button>
          </SignInButton>
        </SignedOut>
      </div>
    </div>
  );
};
/* ================= DESKTOP HEADER ================= */
const DesktopHeader = ({ user, credits }) => (
  <div className="flex items-center justify-between px-8 h-16">
    {/* LEFT - LOGO */}
    <Link href="/" className="flex items-center gap-1 ">
      <Image
        src="/final-logo.png"
        alt="DoctorDesk logo"
        width={60}
        height={60}
        priority
      />
      <span className="text-xl font-bold tracking-tight ">
        Doctor<span className="text-client">Desk</span>
      </span>
    </Link>

    {/* ================= CENTER : Nav ================= */}
    <div className="absolute left-1/2 -translate-x-1/2  md:flex items-center gap-8 text-lg font-bold text-muted-foreground">
      <Link
        href="/labs"
        className="hover:text-client transition underline-center"
      >
        Labs
      </Link>
      <Link
        href="/doctors"
        className="hover:text-client transition underline-center"
      >
        Find Doctors
      </Link>
      <Link
        href="/blog"
        className="hover:text-client transition underline-center"
      >
        Blogs
      </Link>
      <Link
        href="/pricing"
        className="hover:text-client transition underline-center"
      >
        Pricing
      </Link>
      <Link
        href="/about"
        className="hover:text-client transition underline-center"
      >
        About Us
      </Link>

      {user?.role === "PATIENT" && (
        <Link
          href="/appointments"
          className="hover:text-client transition underline-center"
        >
          Appointments
        </Link>
      )}
    </div>

    {/* ================= RIGHT : Actions ================= */}
    <div className="flex items-center gap-3">
      {/* Role Buttons */}
      {role === "ADMIN" && (
        <Link href="/admin">
          <Button variant="outline" size="sm">
            Admin Dashboard
          </Button>
        </Link>
      )}

      {role === "DOCTOR" && (
        <Link href="/doctor">
          <Button variant="outline" size="sm">
            Doctor Dashboard
          </Button>
        </Link>
      )}

      {role === "PATIENT" && (
        <Link href="/appointments">
          <Button variant="outline" size="sm">
            My Appointments
          </Button>
        </Link>
      )}

      {!role  && (
        <Link href="/onboarding">
          <Button variant="outline" size="sm">
            Complete Profile
          </Button>
        </Link>
      )}

      {/* Credits */}
      {user && (
        <Link href="/pricing">
          <Badge
            variant="outline"
            className="px-3 py-1 border-client text-client whitespace-nowrap"
          >
            💳 {credits} Credits
          </Badge>
        </Link>
      )}

      {/* Auth */}
      <SignedOut>
        <SignInButton forceRedirectUrl="/onboarding" fallbackRedirectUrl="/onboarding">
          <Button
            size="sm"
            className="bg-background text-foreground border hover:border-client hover:bg-background"
          >
            Sign In
          </Button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  </div>
);

/* ================= MOBILE MENU ================= */
const MobileMenu = ({ user }) => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="ghost" size="icon">
        <Menu className="w-6 h-6" />
      </Button>
    </SheetTrigger>

    <SheetContent side="left" className="w-[260px] px-5 pt-10">
      <nav className="flex flex-col gap-4 mt-6">

        {user?.role === "PATIENT" && (
          <SheetClose asChild>
            <Link
              href="/appointments"
              className="flex items-center gap-2 p-1 rounded-md active:bg-client/20"
            >
              <Calendar className="w-5 h-5" />
              My Appointments
            </Link>
          </SheetClose>
        )}

        {user?.role === "ADMIN" && (
          <SheetClose asChild>
            <Link
              href="/admin"
              className="flex items-center gap-2 p-1 rounded-md active:bg-client/20"
            >
              <User className="w-5 h-5" />
              Admin Dashboard
            </Link>
          </SheetClose>
        )}

        {user?.role === "DOCTOR" && (
          <SheetClose asChild>
            <Link
              href="/doctor"
              className="flex items-center gap-2 p-1 rounded-md active:bg-client/20"
            >
              <Stethoscope className="w-5 h-5" />
              Doctor Dashboard
            </Link>
          </SheetClose>
        )}

        <SheetClose asChild>
          <Link href="/" className="p-1 font-bold rounded-md active:bg-client/20">
            Home
          </Link>
        </SheetClose>

        <SheetClose asChild>
          <Link href="/labs" className="p-1 font-bold rounded-md active:bg-client/20">
            Labs
          </Link>
        </SheetClose>

        <SheetClose asChild>
          <Link href="/doctors" className="p-1 font-bold rounded-md active:bg-client/20">
            Find Doctors
          </Link>
        </SheetClose>

        <SheetClose asChild>
          <Link href="/blog" className="p-1 font-bold rounded-md active:bg-client/20">
            Blogs
          </Link>
        </SheetClose>

        <SheetClose asChild>
          <Link href="/pricing" className="p-1 font-bold rounded-md active:bg-client/20">
            Pricing
          </Link>
        </SheetClose>

        <SheetClose asChild>
          <Link href="/about" className="p-1 font-bold rounded-md active:bg-client/20">
            About Us
          </Link>
        </SheetClose>
      </nav>
    </SheetContent>
  </Sheet>
);