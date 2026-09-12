"use client";

import { useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { apiPost } from "@/lib/api-client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WritableFileLike {
  write(data: string): Promise<void>;
  close(): Promise<void>;
}
interface DirHandleLike {
  name: string;
  getFileHandle(name: string, opts?: { create?: boolean }): Promise<{ createWritable(): Promise<WritableFileLike> }>;
  requestPermission(opts: { mode: string }): Promise<string>;
}

export function BackupPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirHandleRef = useRef<DirHandleLike | null>(null);
  const [linkedFolder, setLinkedFolder] = useState<string | null>(null);

  async function writeBackupToFolder(handle: DirHandleLike) {
    try {
      const perm = await handle.requestPermission({ mode: "readwrite" });
      if (perm !== "granted") return;
      const res = await fetch("/api/backup");
      const text = await res.text();
      const fh = await handle.getFileHandle("Backup_latest.json", { create: true });
      const writable = await fh.createWritable();
      await writable.write(text);
      await writable.close();
      toast.success("Backup saved to the linked folder.");
    } catch {
      toast.error("Could not save to the linked folder.");
    }
  }

  async function chooseFolder() {
    const picker = (window as unknown as { showDirectoryPicker?: () => Promise<DirHandleLike> }).showDirectoryPicker;
    if (!picker) {
      toast.error("This browser can't link a folder directly. Use \"Download backup now\" instead.");
      return;
    }
    try {
      const handle = await picker();
      dirHandleRef.current = handle;
      setLinkedFolder(handle.name);
      await writeBackupToFolder(handle);
    } catch {
      // user cancelled the picker
    }
  }

  async function handleRestoreFile(file: File) {
    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      toast.error("Could not read that backup file.");
      return;
    }
    if (!confirm("Restore from this backup? This will replace all current data.")) return;
    try {
      await apiPost("/api/backup/restore", parsed);
      toast.success("Backup restored.");
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not restore backup.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Backup &amp; restore</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">
          Download a complete snapshot of your business data — settings, salesmen, price list,
          vouchers, unsaleable sales and inventory
          {linkedFolder ? ` — linked to "${linkedFolder}" for quick re-saves` : ""}.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" onClick={chooseFolder}>
            Link backup folder
          </Button>
          <a href="/api/backup" className={cn(buttonVariants({ variant: "outline" }))}>
            Download backup now
          </a>
          <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()}>
            Restore from backup file
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleRestoreFile(file);
              e.target.value = "";
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
