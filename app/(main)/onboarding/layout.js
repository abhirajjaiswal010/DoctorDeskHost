import { getCurrentUser } from "@/actions/onboarding";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Onboarding - DoctorDesk",
  description: "Complete your profile to get started with DoctorDesk",
};

export default async function OnboardingLayout({ children }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // ❌ Patient should never see onboarding
  if (user.role === "PATIENT") {
    redirect("/doctors");
  }

  // ✅ Doctor logic
  if (user.role === "DOCTOR") {
    // If doctor already completed onboarding
    if (user.specialty) {
      redirect("/doctor");
    }
  }

  // Admin safety
  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">{children}</div>
    </div>
  );
}