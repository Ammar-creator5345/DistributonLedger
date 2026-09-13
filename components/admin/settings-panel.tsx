"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/lib/toast";
import { settingsSchema, type SettingsInput } from "@/schemas/settings";
import { apiPatch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";

const CURRENCY_OPTIONS = [
  { value: "Rs", label: "Rs — Pakistani Rupee" },
  { value: "$", label: "$ — US Dollar" },
  { value: "€", label: "€ — Euro" },
  { value: "£", label: "£ — British Pound" },
  { value: "₹", label: "₹ — Indian Rupee" },
  { value: "AED", label: "AED — UAE Dirham" },
];

export function SettingsPanel({ initial }: { initial: SettingsInput }) {
  const [submitting, setSubmitting] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initial,
  });

  async function onSubmit(values: SettingsInput) {
    setSubmitting(true);
    try {
      await apiPatch("/api/settings", {
        ...values,
        ...(newAdminPassword.trim() ? { newAdminPassword: newAdminPassword.trim() } : {}),
      });
      setNewAdminPassword("");
      toast.success("Settings saved.");
    } catch {
      toast.error("Could not save settings.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Business settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.businessName}>
                <FieldLabel htmlFor="businessName">Business name</FieldLabel>
                <Input id="businessName" {...register("businessName")} />
                <FieldError errors={[errors.businessName]} />
              </Field>
              <Field data-invalid={!!errors.subtitle}>
                <FieldLabel htmlFor="subtitle">Subtitle</FieldLabel>
                <Input id="subtitle" {...register("subtitle")} />
                <FieldError errors={[errors.subtitle]} />
              </Field>
              <Field data-invalid={!!errors.currency}>
                <FieldLabel htmlFor="currency">Currency symbol</FieldLabel>
                <Controller
                  control={control}
                  name="currency"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="currency" className="max-w-55">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.currency]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="newAdminPassword">Change admin password</FieldLabel>
                <Input
                  id="newAdminPassword"
                  type="text"
                  placeholder="Leave blank to keep current password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                />
                <FieldDescription>Used to unlock the Admin panel — separate from your login.</FieldDescription>
              </Field>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save settings"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
