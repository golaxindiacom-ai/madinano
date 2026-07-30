"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Eye,
  FolderTree,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { adminFetch } from "@/lib/admin/client";
import type { Category, CategoryDetailPayload, CategoryLevel, CategoryStats } from "@/lib/admin/types";
import type { CategoryTreeNode } from "@/lib/admin/categories";
import { getCategoryLevelLabel, slugify } from "@/lib/admin/categories";
import {
  cardClass,
  inputClass,
  labelClass,
  selectClass,
  textareaClass,
} from "@/components/admin/course-form-styles";
import {
  adminPageClass,
  adminKpiGridClass,
  adminFilterBarClass,
  adminFilterSelectClass,
  AdminPageHeader,
  AdminLoadingState,
  AdminEmptyState,
} from "@/components/admin/admin-layout";
import { cn } from "@/lib/utils";

type TreeResponse = {
  tree: CategoryTreeNode[];
  flat: CategoryTreeNode[];
  categories: Category[];
};

type FormState = {
  name: string;
  slug: string;
  description: string;
  status: "active" | "inactive";
  order: string;
};

const emptyForm = (): FormState => ({
  name: "",
  slug: "",
  description: "",
  status: "active",
  order: "0",
});

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

function filterTree(nodes: CategoryTreeNode[], query: string, status: string): CategoryTreeNode[] {
  const q = query.trim().toLowerCase();
  const walk = (list: CategoryTreeNode[]): CategoryTreeNode[] =>
    list
      .map((node) => {
        const children = walk(node.children);
        const matchesQuery =
          !q ||
          node.name.toLowerCase().includes(q) ||
          node.slug.toLowerCase().includes(q) ||
          node.breadcrumb.toLowerCase().includes(q);
        const matchesStatus = status === "all" || node.status === status;
        const selfMatch = matchesQuery && matchesStatus;
        if (selfMatch || children.length > 0) {
          return { ...node, children };
        }
        return null;
      })
      .filter(Boolean) as CategoryTreeNode[];

  return walk(nodes);
}

function TreeNode({
  node,
  depth,
  onAddChild,
  onEdit,
  onDelete,
  onView,
  expanded,
  toggle,
}: {
  node: CategoryTreeNode;
  depth: number;
  onAddChild: (parent: CategoryTreeNode) => void;
  onEdit: (cat: CategoryTreeNode) => void;
  onDelete: (cat: CategoryTreeNode) => void;
  onView: (cat: CategoryTreeNode) => void;
  expanded: Set<string>;
  toggle: (id: string) => void;
}) {
  const isOpen = expanded.has(node.id);
  const hasChildren = node.children.length > 0;
  const levelColors = ["text-maroon", "text-gold", "text-forest"];
  const levelBg = ["bg-maroon/10", "bg-gold/15", "bg-forest/10"];

  return (
    <div>
      <div
        className={cn(
          "flex flex-col gap-3 rounded-xl border border-border px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:px-4 sm:py-2.5",
          levelBg[node.level - 1],
        )}
        style={{ marginLeft: depth * 12 }}
      >
        <div className="flex min-w-0 items-start gap-2">
          {hasChildren ? (
            <button type="button" onClick={() => toggle(node.id)} className="mt-0.5 shrink-0 text-muted-foreground">
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}
          <FolderTree className={cn("mt-0.5 h-4 w-4 shrink-0", levelColors[node.level - 1])} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">{node.name}</p>
            <p className="text-xs text-muted-foreground">
              {getCategoryLevelLabel(node.level)} · /{node.slug} · {node.courseCount} course{node.courseCount !== 1 ? "s" : ""}
              {node.children.length > 0 ? ` · ${node.children.length} sub` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 sm:ml-auto sm:justify-end">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
              node.status === "active" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
            )}
          >
            {node.status}
          </span>
          <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => onView(node)}
            title="View details"
            className="rounded-md border border-border p-1.5 hover:bg-background"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          {node.level < 3 && (
            <button
              type="button"
              onClick={() => onAddChild(node)}
              title={`Add ${getCategoryLevelLabel((node.level + 1) as CategoryLevel)}`}
              className="rounded-md border border-border p-1.5 hover:bg-background"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
          <button type="button" onClick={() => onEdit(node)} className="rounded-md border border-border p-1.5 hover:bg-background">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => onDelete(node)} className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          </div>
        </div>
      </div>
      {isOpen &&
        node.children.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            onAddChild={onAddChild}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            expanded={expanded}
            toggle={toggle}
          />
        ))}
    </div>
  );
}

export function CategoriesTreePage() {
  const [tree, setTree] = useState<CategoryTreeNode[]>([]);
  const [flat, setFlat] = useState<CategoryTreeNode[]>([]);
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editing, setEditing] = useState<CategoryTreeNode | null>(null);
  const [parentForNew, setParentForNew] = useState<CategoryTreeNode | null>(null);
  const [newLevel, setNewLevel] = useState<CategoryLevel>(1);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<CategoryDetailPayload | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [data, st] = await Promise.all([
        adminFetch<TreeResponse>("/api/admin/categories/tree"),
        adminFetch<CategoryStats>("/api/admin/categories?stats=true"),
      ]);
      setTree(data.tree);
      setFlat(data.flat);
      setStats(st);
      setExpanded(new Set(data.tree.map((t) => t.id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredTree = useMemo(
    () => filterTree(tree, search, statusFilter),
    [tree, search, statusFilter],
  );

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(flat.map((n) => n.id)));
  const collapseAll = () => setExpanded(new Set());

  const openAddMain = () => {
    setEditing(null);
    setParentForNew(null);
    setNewLevel(1);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openAddChild = (parent: CategoryTreeNode) => {
    setEditing(null);
    setParentForNew(parent);
    setNewLevel((parent.level + 1) as CategoryLevel);
    setForm(emptyForm());
    setExpanded((prev) => new Set([...prev, parent.id]));
    setModalOpen(true);
  };

  const openEdit = (cat: CategoryTreeNode) => {
    setEditing(cat);
    setParentForNew(null);
    setNewLevel(cat.level);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      status: cat.status,
      order: String(cat.order),
    });
    setModalOpen(true);
  };

  const openDetail = async (cat: CategoryTreeNode) => {
    try {
      const data = await adminFetch<CategoryDetailPayload>(`/api/admin/categories/${cat.id}`);
      setDetail(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load details");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Category name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        description: form.description.trim() || undefined,
        status: form.status,
        order: Number(form.order) || 0,
        level: newLevel,
        parentId: parentForNew?.id ?? (editing?.parentId ?? null),
      };

      if (editing) {
        await adminFetch(`/api/admin/categories/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await adminFetch("/api/admin/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
      setDetail(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: CategoryTreeNode) => {
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
    setError("");
    try {
      await adminFetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
      if (detail?.category.id === cat.id) setDetail(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className={adminPageClass}>
      <AdminPageHeader
        title="Course Categories"
        description="Main → Sub → Sub-Sub hierarchy for filtering courses on the website"
        actions={
          <>
            <button type="button" onClick={load} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
            <button type="button" onClick={openAddMain} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground sm:flex-none">
              <Plus className="h-4 w-4" /> Add Main Category
            </button>
          </>
        }
      />

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-ink">
        <span className="font-semibold">Recommended flow:</span>{" "}
        Set up categories here first → then assign them when creating a{" "}
        <Link href="/admin/courses/new" className="font-semibold text-primary underline">
          new course
        </Link>
        . Students can filter courses by main, sub, and sub-sub category on the catalog.
      </div>

      {stats && (
        <div className={adminKpiGridClass}>
          {[
            { label: "Total Categories", value: stats.total, icon: FolderTree },
            { label: "Main (L1)", value: stats.level1, icon: Layers },
            { label: "Sub (L2)", value: stats.level2, icon: Layers },
            { label: "Sub-Sub (L3)", value: stats.level3, icon: Layers },
            { label: "Courses Tagged", value: stats.totalCourses, icon: BookOpen },
          ].map((item) => (
            <div key={item.label} className={cn(cardClass, "flex items-center gap-3 p-4")}>
              <item.icon className="h-8 w-8 text-primary/70" />
              <div>
                <p className="text-2xl font-bold text-ink">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { level: 1, label: "Main Category", color: "border-maroon/30 bg-maroon/10 text-maroon" },
          { level: 2, label: "Sub Category", color: "border-gold/40 bg-gold/15 text-gold" },
          { level: 3, label: "Sub-Sub Category", color: "border-forest/30 bg-forest/10 text-forest" },
        ].map((item) => (
          <div key={item.level} className={cn("rounded-xl border px-4 py-3 text-sm font-semibold", item.color)}>
            Level {item.level}: {item.label}
          </div>
        ))}
      </div>

      <div className={cn("rounded-2xl border border-border bg-card p-4", adminFilterBarClass)}>
        <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, slug, or path..." className={cn(inputClass, "pl-9")} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={adminFilterSelectClass}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button type="button" onClick={expandAll} className="inline-flex w-full items-center justify-center rounded-lg border border-border px-3 py-2.5 text-sm font-semibold sm:w-auto">
          Expand all
        </button>
        <button type="button" onClick={collapseAll} className="inline-flex w-full items-center justify-center rounded-lg border border-border px-3 py-2.5 text-sm font-semibold sm:w-auto">
          Collapse all
        </button>
      </div>

      {error && !modalOpen && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className={cn(cardClass, "space-y-2")}>
        {loading ? (
          <AdminLoadingState message="Loading categories..." />
        ) : filteredTree.length === 0 ? (
          <AdminEmptyState message={tree.length === 0 ? "No categories yet" : "No categories match your filters"} />
        ) : (
          filteredTree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              onAddChild={openAddChild}
              onEdit={openEdit}
              onDelete={handleDelete}
              onView={openDetail}
              expanded={expanded}
              toggle={toggle}
            />
          ))
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/40">
          <div className="flex h-full w-full max-w-md flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-ink">{detail.category.name}</h2>
                <p className="text-xs text-muted-foreground">{detail.breadcrumb}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="rounded-lg p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Level</p>
                  <p className="font-semibold">{getCategoryLevelLabel(detail.category.level)}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Courses</p>
                  <p className="font-semibold">{detail.category.courseCount}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Sub-categories</p>
                  <p className="font-semibold">{detail.childCount}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-semibold capitalize">{detail.category.status}</p>
                </div>
              </div>
              {detail.category.description && (
                <p className="text-sm text-muted-foreground">{detail.category.description}</p>
              )}
              {detail.children.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-ink">Sub-categories</h3>
                  <ul className="mt-2 space-y-1">
                    {detail.children.map((c) => (
                      <li key={c.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                        {c.name} <span className="text-muted-foreground">({c.courseCount} courses)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold text-ink">Courses in this branch</h3>
                {detail.courses.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">No courses assigned yet</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {detail.courses.map((c) => (
                      <li key={c.id} className="rounded-lg border border-border px-3 py-2">
                        <Link href={`/admin/courses/${c.id}/edit`} className="text-sm font-semibold text-primary hover:underline">
                          {c.title}
                        </Link>
                        <p className="text-xs text-muted-foreground capitalize">{c.status}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="border-t border-border p-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const node = flat.find((n) => n.id === detail.category.id);
                  if (node) openEdit(node);
                }}
                className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold"
              >
                Edit
              </button>
              {detail.category.level < 3 && (
                <button
                  type="button"
                  onClick={() => {
                    const node = flat.find((n) => n.id === detail.category.id);
                    if (node) openAddChild(node);
                  }}
                  className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground"
                >
                  Add child
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSave} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-card p-6 shadow-xl">
            <h2 className="text-lg font-bold text-ink">
              {editing ? "Edit Category" : `Add ${getCategoryLevelLabel(newLevel)}`}
            </h2>
            {parentForNew && (
              <p className="mt-1 text-xs text-muted-foreground">Under: {parentForNew.breadcrumb}</p>
            )}
            {error && modalOpen && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className={labelClass}>Name *</span>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      name: e.target.value,
                      slug: f.slug || slugify(e.target.value),
                    }))
                  }
                  className={inputClass}
                  placeholder="e.g. Web Development"
                />
              </label>
              <label className="block">
                <span className={labelClass}>Slug</span>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                  className={inputClass}
                  placeholder="web-development"
                />
              </label>
              <label className="block">
                <span className={labelClass}>Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className={textareaClass + " min-h-[80px]"}
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className={labelClass}>Order</span>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Status</span>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as FormState["status"] }))}
                    className={selectClass}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setError("");
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
