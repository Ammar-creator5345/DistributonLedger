"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import AddIcon from "@mui/icons-material/Add";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/lib/toast";
import { skuSchema, type SkuInput } from "@/schemas/sku";
import { apiPost } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import type { SkuLike } from "@/types";

export function AddSkuDialog({
  onCreated,
}: {
  onCreated: (sku: SkuLike & { _id: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SkuInput>({
    resolver: zodResolver(skuSchema),
    defaultValues: { name: "", category: "", distRate: 0, retailRate: 0, wholesaleRate: 0 },
  });
  const category = useWatch({ control, name: "category" });

  async function onSubmit(values: SkuInput) {
    try {
      const created = await apiPost<SkuLike & { _id: string }>("/api/skus", values);
      toast.success("SKU added.");
      onCreated(created);
      reset();
      setOpen(false);
    } catch {
      toast.error("Could not add SKU.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <AddIcon fontSize="small" /> Add SKU
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add SKU</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="mSkuName">Name</FieldLabel>
              <Input id="mSkuName" placeholder="e.g. Marlboro Gold 20s" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="mSkuCategory">Category</FieldLabel>
              <Select
                value={category || "none"}
                onValueChange={(v) => setValue("category", v === "none" ? "" : (v as "FMC" | "NC"))}
              >
                <SelectTrigger id="mSkuCategory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  <SelectItem value="FMC">FMC</SelectItem>
                  <SelectItem value="NC">NC</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field data-invalid={!!errors.distRate}>
                <FieldLabel htmlFor="mSkuDist">Distributor rate</FieldLabel>
                <Input
                  id="mSkuDist"
                  type="number"
                  step="0.01"
                  {...register("distRate", { valueAsNumber: true })}
                />
                <FieldError errors={[errors.distRate]} />
              </Field>
              <Field data-invalid={!!errors.retailRate}>
                <FieldLabel htmlFor="mSkuRetail">Retail rate</FieldLabel>
                <Input
                  id="mSkuRetail"
                  type="number"
                  step="0.01"
                  {...register("retailRate", { valueAsNumber: true })}
                />
                <FieldError errors={[errors.retailRate]} />
              </Field>
              <Field data-invalid={!!errors.wholesaleRate}>
                <FieldLabel htmlFor="mSkuWholesale">Wholesale rate</FieldLabel>
                <Input
                  id="mSkuWholesale"
                  type="number"
                  step="0.01"
                  {...register("wholesaleRate", { valueAsNumber: true })}
                />
                <FieldError errors={[errors.wholesaleRate]} />
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Add SKU
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
