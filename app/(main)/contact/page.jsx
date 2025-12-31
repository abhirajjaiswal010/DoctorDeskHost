"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Mail, Phone, MessageSquare } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  /* ---------------- HOOKS (ALWAYS AT TOP) ---------------- */
  const { user, isLoaded, isSignedIn } = useUser();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });

  /* ---------------- AUTO-FILL FROM CLERK ---------------- */
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setForm((prev) => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.primaryEmailAddress?.emailAddress || "",
      }));
    }
  }, [isLoaded, isSignedIn, user]);

  /* ---------------- LOADING STATE ---------------- */
  if (!isLoaded) return null;

  /* ---------------- NOT LOGGED IN ---------------- */
  if (!isSignedIn) {
    return (
      <section className="py-24">
        <div className="container mx-auto text-center max-w-lg px-6">
          <h1 className="text-3xl font-bold mb-4">Contact Our Team</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to contact our support team.
          </p>

          <SignInButton mode="modal">
            <Button className="bg-client">
              Sign in to continue
            </Button>
          </SignInButton>
        </div>
      </section>
    );
  }

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async () => {
    if (!form.message) {
      toast.error("Message is required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: form.message }),
      });

      if (res.ok) {
        toast.success("Message sent successfully 📩");
        setForm((prev) => ({ ...prev, message: "" }));
      } else {
        toast.error("Something went wrong");
      }
    } catch {
      toast.error("Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6 lg:px-20">

        {/* Heading */}
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold">Contact Our Team</h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Have questions about online doctor consultations, credits, or appointments?
            Our team is here to help you.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 max-w-5xl mx-auto">

          {/* FORM */}
          <Card>
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input value={form.firstName} disabled />
                <Input value={form.lastName} disabled />
              </div>

              <Input type="email" value={form.email} disabled />

              <Textarea
                rows={4}
                placeholder="Tell us how we can help you..."
                value={form.message}
                onChange={(e) =>
                  setForm({ ...form, message: e.target.value })
                }
              />

              <Button
                className="w-full bg-client"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send message"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                We usually respond within 24 hours.
              </p>
            </CardContent>
          </Card>

          {/* INFO */}
          <div className="space-y-6">
            <Card>
              <CardContent className="flex gap-4 p-6">
                <MessageSquare className="h-6 w-6 text-client" />
                <div>
                  <h3 className="font-semibold">Chat with us</h3>
                  <p className="text-sm text-muted-foreground">
                    Live chat (coming soon)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex gap-4 p-6">
                <Mail className="h-6 w-6 text-client" />
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <p className="text-sm text-client mt-1">
                   doctordeskOfficial@gmail.com
                   doctordesk.team@gmail.com
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex gap-4 p-6">
                <Phone className="h-6 w-6 text-client" />
                <div>
                  <h3 className="font-semibold">Call us</h3>
                  <p className="text-sm text-muted-foreground">
                    Mon – Fri, 9am to 6pm
                  </p>
                  <p className="text-sm text-client mt-1">
                    +91 81094-24356
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </section>
  );
}
