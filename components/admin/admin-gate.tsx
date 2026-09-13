"use client";

import { useState, type ReactNode } from "react";
import { toast } from "@/lib/toast";
import { apiPost } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Lock, Eye, EyeOff } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="mx-auto flex max-w-sm flex-col py-12">
      <Card className="w-full py-8">
        <CardHeader className="items-center gap-3 px-8 text-center">
          <div className="mx-auto mb-1 flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
            <Lock className="size-6" />
          </div>
          <CardTitle className="font-heading text-xl">Admin</CardTitle>
          <CardDescription>Authorized access only.</CardDescription>
        </CardHeader>
        <CardContent className="px-8">
          <form onSubmit={handleUnlock} className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="adminPasswordInput">Password</FieldLabel>
              <div className="relative">
                <Input
                  id="adminPasswordInput"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
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
