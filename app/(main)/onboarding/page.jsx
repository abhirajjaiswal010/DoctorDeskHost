// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { User, Stethoscope, Loader2 } from "lucide-react";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { setUserRole } from "@/actions/onboarding";
// import { doctorFormSchema } from "@/lib/schema";
// import { SPECIALTIES } from "@/lib/specialities";

// export default function OnboardingPage() {
//   const [step, setStep] = useState("choose-role");
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState(null);

//   const router = useRouter();

//   // React Hook Form setup with Zod validation
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     setValue,
//     watch,
//   } = useForm({
//     resolver: zodResolver(doctorFormSchema),
//     defaultValues: {
//       specialty: "",
//       phone:undefined,
//       qualifications: "",
//       experience: undefined,
//       credentialUrl: "",
//       description: "",
//     },
//   });

//   const specialtyValue = watch("specialty");

//   // Stable function to submit user role
//   const submitUserRoleSafe = useCallback(async (formData) => {
//     try {
//       setLoading(true);
//       const res = await setUserRole(formData);
//       setResult(res);
//     } catch (err) {
//       console.error("Error submitting role:", err);
//       alert(err.message || "Failed to submit");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Redirect effect — triggers only once when submission is successful
//   useEffect(() => {
//     if (result?.success && result.redirect) {
//       router.replace(result.redirect);
//     }
//   }, [result?.success, result?.redirect, router]);

//   // Handle patient selection
//   const handlePatientSelection = async () => {
//     if (loading) return;

//     const formData = new FormData();
//     formData.append("role", "PATIENT");

//     await submitUserRoleSafe(formData);
//   };

//   // Handle doctor form submission
//   const onDoctorSubmit = async (data) => {
//     if (loading) return;

//     const formData = new FormData();
//     formData.append("role", "DOCTOR");
//     formData.append("specialty", data.specialty);
//     formData.append("phone", data.phone);
//    const qualificationsArray = data.qualifications
//     ? data.qualifications.split(",").map((q) => q.trim())
//     : [];
//   formData.append("qualifications", JSON.stringify(qualificationsArray));
//     formData.append("experience", data.experience.toString());
//     formData.append("credentialUrl", data.credentialUrl);
//     formData.append("description", data.description);

//     await submitUserRoleSafe(formData);
//   };

//   // Role selection screen
//   if (step === "choose-role") {
//     return (
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <Card
//           className="border-emerald-900/20 hover:border-emerald-700/40 cursor-pointer transition-all"
//           onClick={handlePatientSelection}
//         >
//           <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
//             <div className="p-4 bg-emerald-900/20 rounded-full mb-4">
//               <User className="h-8 w-8 text-emerald-400" />
//             </div>
//             <CardTitle className="text-xl font-semibold text-white mb-2">
//               Join as a Patient
//             </CardTitle>
//             <CardDescription className="mb-4">
//               Book appointments, consult with doctors, and manage your
//               healthcare journey
//             </CardDescription>
//             <Button
//               className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700"
//               disabled={loading}
//             >
//               {loading ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Processing...
//                 </>
//               ) : (
//                 "Continue as Patient"
//               )}
//             </Button>
//           </CardContent>
//         </Card>

//         <Card
//           className="border-emerald-900/20 hover:border-emerald-700/40 cursor-pointer transition-all"
//           onClick={() => setStep("doctor-form")}
//         >
//           <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
//             <div className="p-4 bg-emerald-900/20 rounded-full mb-4">
//               <Stethoscope className="h-8 w-8 text-emerald-400" />
//             </div>
//             <CardTitle className="text-xl font-semibold text-white mb-2">
//               Join as a Doctor
//             </CardTitle>
//             <CardDescription className="mb-4">
//               Create your professional profile, set your availability, and
//               provide consultations
//             </CardDescription>
//             <Button
//               className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700"
//               disabled={loading}
//             >
//               Continue as Doctor
//             </Button>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   // Doctor registration form
//   if (step === "doctor-form") {
//     return (
//       <Card className="border-emerald-900/20">
//         <CardContent className="pt-6">
//           <div className="mb-6">
//             <CardTitle className="text-2xl font-bold text-white mb-2">
//               Complete Your Doctor Profile
//             </CardTitle>
//             <CardDescription>
//               Please provide your professional details for verification
//             </CardDescription>
//           </div>

//           <form onSubmit={handleSubmit(onDoctorSubmit)} className="space-y-6">
//             <div className="space-y-2">
//               <Label htmlFor="specialty">Medical Specialty</Label>
//               <Select
//                 value={specialtyValue}
//                 onValueChange={(value) => setValue("specialty", value)}
//               >
//                 <SelectTrigger id="specialty">
//                   <SelectValue placeholder="Select your specialty" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {SPECIALTIES.map((spec) => (
//                     <SelectItem
//                       key={spec.name}
//                       value={spec.name}
//                       className="flex items-center gap-2"
//                     >
//                       <span className="text-client">{spec.icon}</span>
//                       {spec.name}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//               {errors.specialty && (
//                 <p className="text-sm font-medium text-red-500 mt-1">
//                   {errors.specialty.message}
//                 </p>
//               )}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="experience">Years of Experience</Label>
//               <Input
//                 id="experience"
//                 type="number"
//                  min={0}
//                 placeholder="e.g. 5"
//                 {...register("experience", { valueAsNumber: true })}
//               />
//               {errors.experience && (
//                 <p className="text-sm font-medium text-red-500 mt-1">
//                   {errors.experience.message}
//                 </p>
//               )}
//             </div>
//             <div className="space-y-2">
//   <Label htmlFor="phone">Phone Number</Label>
//   <Input
//     id="phone"
//     type="tel"
//     placeholder="e.g. +91 9876543210"
//     {...register("phone")}
//   />
//   {errors.phone && (
//     <p className="text-sm text-red-500">{errors.phone.message}</p>
//   )}
// </div>
//             <div className="space-y-2">
//               <Label htmlFor="qualifications">Qualification</Label>
//               <Input
//                 id="qualifications"
//                 placeholder="MBBS, MD (Cardiology)"
//                 {...register("qualifications")}
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="credentialUrl">Link to Credential Document</Label>
//               <Input
//                 id="credentialUrl"
//                 type="url"
//                 placeholder="https://example.com/my-medical-degree.pdf"
//                 {...register("credentialUrl")}
//               />
//               {errors.credentialUrl && (
//                 <p className="text-sm font-medium text-red-500 mt-1">
//                   {errors.credentialUrl.message}
//                 </p>
//               )}
//               <p className="text-sm text-muted-foreground">
//                 Please provide a link to your medical degree or certification
//               </p>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="description">Description of Your Services</Label>
//               <Textarea
//                 id="description"
//                 placeholder="Describe your expertise, services, and approach to patient care..."
//                 rows="4"
//                 {...register("description")}
//               />
//               {errors.description && (
//                 <p className="text-sm font-medium text-red-500 mt-1">
//                   {errors.description.message}
//                 </p>
//               )}
//             </div>

//             <div className="pt-2 flex items-center justify-between">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => setStep("choose-role")}
//                 className="border-emerald-900/30"
//                 disabled={loading}
//               >
//                 Back
//               </Button>
//               <Button
//                 type="submit"
//                 className="bg-emerald-600 hover:bg-emerald-700"
//                 disabled={loading}
//               >
//                 {loading ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Submitting...
//                   </>
//                 ) : (
//                   "Submit for Verification"
//                 )}
//               </Button>
//             </div>
//           </form>
//         </CardContent>
//       </Card>
//     );
//   }
// }
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Stethoscope, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { setUserRole } from "@/actions/onboarding";
import { doctorFormSchema } from "@/lib/schema";
import { SPECIALTIES } from "@/lib/specialities";

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState("choose-role");
  const [loading, setLoading] = useState(false);

  /* ---------------- FORM SETUP ---------------- */
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      specialty: "",
      phone: "",
      qualifications: "",
      experience: undefined,
      credentialUrl: "",
      description: "",
    },
  });

  const specialtyValue = watch("specialty");

  /* ---------------- SUBMIT (FINAL FIX) ---------------- */
  const submitUserRoleSafe = useCallback(
    async (formData) => {
      try {
        setLoading(true);

        const res = await setUserRole(formData);

        // ✅ DIRECT REDIRECT (NO useEffect)
        if (res?.redirect) {
          router.replace(res.redirect);
          return;
        }

        if (res?.message) {
          alert(res.message);
        }
      } catch (err) {
        console.error("Error submitting role:", err);
        alert("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  /* ---------------- PATIENT FLOW ---------------- */
  const handlePatientSelection = async () => {
    if (loading) return;

    const formData = new FormData();
    formData.append("role", "PATIENT");

    await submitUserRoleSafe(formData);
  };

  /* ---------------- DOCTOR FLOW ---------------- */
  const onDoctorSubmit = async (data) => {
    if (loading) return;

    const formData = new FormData();
    formData.append("role", "DOCTOR");
    formData.append("specialty", data.specialty);
    formData.append("phone", data.phone);

    const qualificationsArray = data.qualifications
      ? data.qualifications.split(",").map((q) => q.trim())
      : [];
    formData.append("qualifications", JSON.stringify(qualificationsArray));

    formData.append("experience", String(data.experience));
    formData.append("credentialUrl", data.credentialUrl);
    formData.append("description", data.description);

    await submitUserRoleSafe(formData);
  };

  /* ================= STEP 1: ROLE SELECTION ================= */
  if (step === "choose-role") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PATIENT */}
        <Card
          onClick={handlePatientSelection}
          className="border-emerald-900/20 hover:border-emerald-700/40 cursor-pointer transition-all"
        >
          <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
            <div className="p-4 bg-emerald-900/20 rounded-full mb-4">
              <User className="h-8 w-8 text-emerald-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-white mb-2">
              Join as a Patient
            </CardTitle>
            <CardDescription className="mb-4">
              Book appointments, consult with doctors, and manage your
              healthcare journey
            </CardDescription>
            <Button
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Continue as Patient"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* DOCTOR */}
        <Card
          className="border-emerald-900/20 hover:border-emerald-700/40 cursor-pointer transition-all"
          onClick={() => setStep("doctor-form")}
        >
          <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
            <div className="p-4 bg-emerald-900/20 rounded-full mb-4">
              <Stethoscope className="h-8 w-8 text-emerald-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-white mb-2">
              Join as a Doctor
            </CardTitle>
            <CardDescription className="mb-4">
              Create your professional profile and provide consultations
            </CardDescription>
            <Button
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700"
            >
              Continue as Doctor
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ================= STEP 2: DOCTOR FORM ================= */
  return (
    <Card className="border-emerald-900/20">
      <CardContent className="pt-6">
        <CardTitle className="text-2xl font-bold mb-2">
          Complete Your Doctor Profile
        </CardTitle>
        <CardDescription className="mb-6">
          Please provide your professional details for verification
        </CardDescription>

        <form onSubmit={handleSubmit(onDoctorSubmit)} className="space-y-6">
          <div>
            <Label>Medical Specialty</Label>
            <Select
              value={specialtyValue}
              onValueChange={(value) => setValue("specialty", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your specialty" />
              </SelectTrigger>
              <SelectContent>
                {SPECIALTIES.map((spec) => (
                  <SelectItem key={spec.name} value={spec.name}>
                    {spec.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.specialty && (
              <p className="text-sm text-red-500">
                {errors.specialty.message}
              </p>
            )}
          </div>

          <div>
            <Label>Years of Experience</Label>
            <Input
              type="number"
              min={0}
              {...register("experience", { valueAsNumber: true })}
            />
          </div>

          <div>
            <Label>Phone Number</Label>
            <Input type="tel" {...register("phone")} />
          </div>

          <div>
            <Label>Qualifications</Label>
            <Input {...register("qualifications")} />
          </div>

          <div>
            <Label>Credential Document URL</Label>
            <Input type="url" {...register("credentialUrl")} />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea rows={4} {...register("description")} />
          </div>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("choose-role")}
            >
              Back
            </Button>

            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit for Verification"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}