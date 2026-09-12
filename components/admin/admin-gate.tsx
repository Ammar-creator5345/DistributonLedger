"use client";

import { useState, type ReactNode } from "react";
import { toast } from "@/lib/toast";
import { apiPost } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { ShieldCheck } from "lucide-react";

/**
 * Secondary Admin-panel gate matching the source app's UI.adminUnlocked flow (default password
 * "admin456", changeable in Business settings). This is UX parity with the source app, not the
 * real security boundary — the whole /admin route already requires a signed-in session
 * (spec section 9); this only resets each time the page loads, exactly like the source app.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setSubmitting(true);
    try {
      await apiPost("/api/admin/verify", { password });
      setUnlocked(true);
    } catch {
      toast.error("Incorrect password.");
    } finally {
      setSubmitting(false);
    }
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 py-12">
      <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
        <ShieldCheck className="size-6" />
      </div>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-xl">Admin</CardTitle>
          <CardDescription>Enter the admin password to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUnlock} className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="adminPasswordInput">Password</FieldLabel>
              <Input
                id="adminPasswordInput"
                type="password"
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </Field>
            <Button type="submit" disabled={submitting || !password}>
              {submitting ? "Checking…" : "Unlock"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
