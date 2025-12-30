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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(doctorFormSchema),
  });

  const specialtyValue = watch("specialty");

  const submitSafe = useCallback(
    async (formData) => {
      setLoading(true);
      const res = await setUserRole(formData);
      setLoading(false);

      if (res?.redirect) {
        router.replace(res.redirect);
      }
    },
    [router]
  );

  // PATIENT
  const handlePatient = async () => {
    const fd = new FormData();
    fd.append("role", "PATIENT");
    await submitSafe(fd);
  };

  // DOCTOR
  const onDoctorSubmit = async (data) => {
    const fd = new FormData();
    fd.append("role", "DOCTOR");
    fd.append("specialty", data.specialty);
    fd.append("phone", data.phone);
    fd.append(
      "qualifications",
      JSON.stringify(data.qualifications?.split(",") || [])
    );
    fd.append("experience", String(data.experience));
    fd.append("credentialUrl", data.credentialUrl);
    fd.append("description", data.description);

    await submitSafe(fd);
  };

  if (step === "choose-role") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card onClick={handlePatient} className="cursor-pointer">
          <CardContent className="text-center p-6">
            <User className="mx-auto mb-4 text-client" />
            <CardTitle>Join as Patient</CardTitle>
            <Button className="mt-4 w-full">Continue</Button>
          </CardContent>
        </Card>

        <Card onClick={() => setStep("doctor")} className="cursor-pointer">
          <CardContent className="text-center p-6">
            <Stethoscope className="mx-auto mb-4 text-client" />
            <CardTitle>Join as Doctor</CardTitle>
            <Button className="mt-4 w-full">Continue</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onDoctorSubmit)} className="space-y-4">
      <Label>Specialty</Label>
      <Select
        value={specialtyValue}
        onValueChange={(v) => setValue("specialty", v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select specialty" />
        </SelectTrigger>
        <SelectContent>
          {SPECIALTIES.map((s) => (
            <SelectItem key={s.name} value={s.name}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input placeholder="Phone" {...register("phone")} />
      <Input placeholder="Experience" type="number" {...register("experience")} />
      <Input placeholder="Qualifications" {...register("qualifications")} />
      <Input placeholder="Credential URL" {...register("credentialUrl")} />
      <Textarea placeholder="Description" {...register("description")} />

      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : "Submit"}
      </Button>
    </form>
  );
}