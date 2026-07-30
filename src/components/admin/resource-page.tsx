"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, RefreshCw, Search } from "lucide-react";
import type { FieldConfig } from "@/lib/admin/resources";
import { RESOURCES } from "@/lib/admin/resources";
import { adminFetch, formatCell, resourceApiPath } from "@/lib/admin/client";
import {
  adminPageClass,
  adminFilterBarClass,
  AdminPageHeader,
  AdminDesktopTable,
  AdminMobileList,
  AdminMobileCard,
  AdminMobileRow,
  AdminMobileActions,
  AdminLoadingState,
  AdminEmptyState,
} from "@/components/admin/admin-layout";
import { cn } from "@/lib/utils";

type Row = Record<string, unknown>;

export function ResourcePage({
  collectionKey,
  apiSlug,
}: {
  collectionKey: string;
  apiSlug: string;
}) {
  const config = RESOURCES[collectionKey]!;
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : "";
      const data = await adminFetch<Row[]>(`${resourceApiPath(apiSlug)}${q}`);
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [apiSlug, search]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(Object.fromEntries(config.fields.map((f) => [f.key, ""])));
    setModalOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    setForm(
      Object.fromEntries(
        config.fields.map((f) => [
          f.key,
          Array.isArray(row[f.key]) ? (row[f.key] as string[]).join(", ") : String(row[f.key] ?? ""),
        ]),
      ),
    );
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const parseValue = (field: FieldConfig, raw: string) => {
    if (field.type === "number") return raw === "" ? 0 : Number(raw);
    if (field.type === "checkbox") return raw === "true";
    return raw;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {};
      for (const field of config.fields) {
        payload[field.key] = parseValue(field, form[field.key] ?? "");
      }

      if (editing?.id) {
        await adminFetch(`${resourceApiPath(apiSlug)}/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await adminFetch(resourceApiPath(apiSlug), {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      closeModal();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: Row) => {
    if (!confirm(`Delete this ${config.singular.toLowerCase()}?`)) return;
    try {
      await adminFetch(`${resourceApiPath(apiSlug)}/${row.id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const filtered = useMemo(() => items, [items]);

  return (
    <div className={adminPageClass}>
      <AdminPageHeader
        title={config.label}
        description={`Manage ${config.label.toLowerCase()} via API`}
        actions={
          !config.readOnly ? (
            <button
              onClick={openCreate}
              className="inline-flex w-full flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 sm:w-auto sm:flex-none"
            >
              <Plus className="h-4 w-4" /> Add {config.singular}
            </button>
          ) : undefined
        }
      />

      <div className={cn("rounded-2xl border border-border bg-card p-4", adminFilterBarClass)}>
        <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${config.label.toLowerCase()}...`}
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none"
          />
        </div>
        <button
          onClick={load}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:border-primary hover:text-primary sm:w-auto"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <AdminDesktopTable>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {config.columns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-semibold">
                  {col.label}
                </th>
              ))}
              {!config.readOnly && <th className="px-4 py-3 font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={config.columns.length + 1} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={config.columns.length + 1} className="px-4 py-8 text-center text-muted-foreground">
                  No records found
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={String(row.id)} className="border-b border-border/60 hover:bg-muted/30">
                  {config.columns.map((col) => (
                    <td key={col.key} className="max-w-[220px] truncate px-4 py-3 text-foreground/85">
                      {formatCell(row[col.key])}
                    </td>
                  ))}
                  {!config.readOnly && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(row)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:border-primary hover:text-primary"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:border-rose-500 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminDesktopTable>

      <AdminMobileList>
        {loading ? (
          <AdminLoadingState message="Loading..." />
        ) : filtered.length === 0 ? (
          <AdminEmptyState message="No records found" />
        ) : (
          filtered.map((row) => (
            <AdminMobileCard key={String(row.id)}>
              {config.columns.slice(0, 2).map((col) => (
                <div key={col.key} className={col.key === config.columns[0]?.key ? undefined : "mt-2 border-t border-border/60 pt-2"}>
                  {col.key === config.columns[0]?.key ? (
                    <p className="font-semibold text-ink">{formatCell(row[col.key])}</p>
                  ) : (
                    <AdminMobileRow label={col.label}>{formatCell(row[col.key])}</AdminMobileRow>
                  )}
                </div>
              ))}
              {config.columns.slice(2).map((col) => (
                <AdminMobileRow key={col.key} label={col.label}>{formatCell(row[col.key])}</AdminMobileRow>
              ))}
              {!config.readOnly && (
                <AdminMobileActions>
                  <button
                    onClick={() => openEdit(row)}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(row)}
                    className="inline-flex items-center justify-center rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </AdminMobileActions>
              )}
            </AdminMobileCard>
          ))
        )}
      </AdminMobileList>

      {modalOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4">
          <form
            onSubmit={handleSubmit}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-float"
          >
            <h2 className="text-lg font-bold text-ink">
              {editing ? `Edit ${config.singular}` : `Add ${config.singular}`}
            </h2>
            <div className="mt-4 space-y-4">
              {config.fields.map((field) => (
                <label key={field.key} className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {field.label}
                  </span>
                  {field.type === "textarea" ? (
                    <textarea
                      value={form[field.key] ?? ""}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      required={field.required}
                      rows={4}
                      className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={form[field.key] ?? ""}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      required={field.required}
                      className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    >
                      <option value="">Select...</option>
                      {field.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === "number" ? "number" : field.type === "date" ? "datetime-local" : field.type}
                      value={form[field.key] ?? ""}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      required={field.required}
                      className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
