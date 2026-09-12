"use client";

import { useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { apiDelete, apiPatch, apiPost } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface SalesmanRow {
  _id: string;
  name: string;
  filerCategory: "" | "Filer" | "Non-Filer";
}

export function SalesmenPanel({ initial }: { initial: SalesmanRow[] }) {
  const [salesmen, setSalesmen] = useState(initial);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function renameSalesman(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await apiPatch(`/api/salesmen/${id}`, { name: trimmed });
    } catch {
      toast.error("Could not save salesman name.");
    }
  }

  async function addSalesman() {
    try {
      const created = await apiPost<SalesmanRow>("/api/salesmen", {
        name: "New salesman",
        filerCategory: "",
        active: true,
      });
      setSalesmen((prev) => [...prev, created]);
    } catch {
      toast.error("Could not add salesman.");
    }
  }

  async function deleteSalesman(id: string) {
    try {
      await apiDelete(`/api/salesmen/${id}`);
      setSalesmen((prev) => prev.filter((s) => s._id !== id));
      toast.success("Salesman removed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove salesman.");
    }
  }

  async function handleImportFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/salesmen/import", { method: "POST", body: formData });
      const body = await res.json();
      if (!body.success) throw new Error(body.error);
      toast.success(
        `Imported: ${body.data.added} added${body.data.skipped ? `, ${body.data.skipped} skipped` : ""}.`
      );
      const listRes = await fetch("/api/salesmen");
      const listBody = await listRes.json();
      if (listBody.success) setSalesmen(listBody.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed.");
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="font-heading text-lg">Salesmen</CardTitle>
        <div className="flex flex-wrap gap-2">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- this is a file download endpoint, not a page; next/link would client-route instead of downloading */}
          <a
            href="/api/salesmen/import/template"
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
          <Button size="sm" onClick={addSalesman}>
            <AddIcon fontSize="small" /> Add salesman
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesmen.map((s) => (
                <TableRow key={s._id}>
                  <TableCell>
                    <Input
                      defaultValue={s.name}
                      onBlur={(e) => renameSalesman(s._id, e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove salesman"
                      className="hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setConfirmDeleteId(s._id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!salesmen.length && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                    No salesmen yet.
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
        title="Remove this salesman?"
        description="This can't be undone. Salesmen with existing vouchers can't be removed."
        confirmLabel="Remove"
        onConfirm={() => {
          if (confirmDeleteId) deleteSalesman(confirmDeleteId);
        }}
      />
    </Card>
  );
}
