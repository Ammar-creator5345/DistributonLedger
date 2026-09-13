"use client";

import { useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { apiDelete, apiPatch, apiPost } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Trash2 } from "lucide-react";
import AddIcon from "@mui/icons-material/Add";

interface SkuRow {
  _id: string;
  name: string;
  category: "" | "FMC" | "NC";
  distRate: number;
  retailRate: number;
  wholesaleRate: number;
}

export function SkusPanel({ initial }: { initial: SkuRow[] }) {
  const [skus, setSkus] = useState(initial);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function patchSku(id: string, patch: Partial<SkuRow>) {
    try {
      await apiPatch(`/api/skus/${id}`, patch);
      setSkus((prev) => prev.map((s) => (s._id === id ? { ...s, ...patch } : s)));
    } catch {
      toast.error("Could not save SKU.");
    }
  }

  async function addSku() {
    try {
      const created = await apiPost<SkuRow>("/api/skus", {
        name: "New SKU",
        category: "",
        distRate: 0,
        retailRate: 0,
        wholesaleRate: 0,
      });
      setSkus((prev) => [...prev, created]);
    } catch {
      toast.error("Could not add SKU.");
    }
  }

  async function deleteSku(id: string) {
    try {
      await apiDelete(`/api/skus/${id}`);
      setSkus((prev) => prev.filter((s) => s._id !== id));
      toast.success("SKU removed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove SKU.");
    }
  }

  async function handleImportFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/skus/import", { method: "POST", body: formData });
      const body = await res.json();
      if (!body.success) throw new Error(body.error);
      toast.success(
        `Imported: ${body.data.added} added, ${body.data.updated} updated${body.data.errors.length ? `, ${body.data.errors.length} skipped` : ""}.`
      );
      const listRes = await fetch("/api/skus");
      const listBody = await listRes.json();
      if (listBody.success) setSkus(listBody.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed.");
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="font-heading text-lg">Price list / SKUs</CardTitle>
        <div className="flex flex-wrap gap-2">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- this is a file download endpoint, not a page; next/link would client-route instead of downloading */}
          <a
            href="/api/skus/import/template"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Download Excel template
          </a>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            Import from Excel
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = "";
            }}
          />
          <Button size="sm" onClick={addSku}>
            <AddIcon fontSize="small" /> Add SKU
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">
          Sale amount = Quantity × Retail Rate (retail) or × Wholesale Rate (wholesale) — always
          taken from this price list. Distributor Rate is the cost base used only to calculate
          profit.
        </p>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Distributor rate</TableHead>
                <TableHead>Retail rate</TableHead>
                <TableHead>Wholesale rate</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {skus.map((s) => (
                <TableRow key={s._id}>
                  <TableCell className="min-w-[180px]">
                    <Input
                      defaultValue={s.name}
                      onBlur={(e) => patchSku(s._id, { name: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={s.category || "none"}
                      onValueChange={(v) =>
                        patchSku(s._id, { category: v === "none" ? "" : (v as SkuRow["category"]) })
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        <SelectItem value="FMC">FMC</SelectItem>
                        <SelectItem value="NC">NC</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      className="font-mono"
                      defaultValue={s.distRate}
                      onBlur={(e) => patchSku(s._id, { distRate: Number(e.target.value) || 0 })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      className="font-mono"
                      defaultValue={s.retailRate}
                      onBlur={(e) => patchSku(s._id, { retailRate: Number(e.target.value) || 0 })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      className="font-mono"
                      defaultValue={s.wholesaleRate}
                      onBlur={(e) =>
                        patchSku(s._id, { wholesaleRate: Number(e.target.value) || 0 })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove SKU"
                      className="hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setConfirmDeleteId(s._id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!skus.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    No SKUs yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="Remove this SKU?"
        description="This can't be undone. SKUs with voucher history can't be removed."
        confirmLabel="Remove"
        onConfirm={() => {
          if (confirmDeleteId) deleteSku(confirmDeleteId);
        }}
      />
    </Card>
  );
}
