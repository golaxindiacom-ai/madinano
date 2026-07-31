"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { adminFetch } from "@/lib/admin/client";

export function AdminBackupPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setMessage("");
    try {
      const data = await adminFetch<unknown>("/api/admin/backup");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `madinano-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage("Backup downloaded successfully");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Export failed");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setMessage("");
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await adminFetch("/api/admin/backup", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setMessage("Backup restored successfully. Refresh pages to see changes.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Restore failed");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Backup & Restore</h1>
        <p className="mt-1 text-sm text-muted-foreground">Export or restore the full admin database</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={handleExport}
          disabled={loading}
          className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 hover:border-primary"
        >
          <Download className="h-8 w-8 text-primary" />
          <span className="font-semibold text-ink">Export Backup</span>
          <span className="text-xs text-muted-foreground">Download JSON file</span>
        </button>

        <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 hover:border-primary">
          <Upload className="h-8 w-8 text-primary" />
          <span className="font-semibold text-ink">Restore Backup</span>
          <span className="text-xs text-muted-foreground">Upload JSON file</span>
          <input type="file" accept="application/json" className="hidden" onChange={handleImport} disabled={loading} />
        </label>
      </div>

      {message && <p className="text-sm text-primary">{message}</p>}
    </div>
  );
}
