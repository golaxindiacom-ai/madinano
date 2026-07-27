"use client";

import { useMemo } from "react";
import type { Category } from "@/lib/admin/types";
import { getCategoryChildren } from "@/lib/admin/categories";
import { labelClass, selectClass, helperClass } from "@/components/admin/course-form-styles";

type Props = {
  categories: Category[];
  mainCategoryId: string;
  subCategoryId: string;
  subSubCategoryId: string;
  onMainChange: (id: string) => void;
  onSubChange: (id: string) => void;
  onSubSubChange: (id: string) => void;
};

export function CategoryCascadeSelect({
  categories,
  mainCategoryId,
  subCategoryId,
  subSubCategoryId,
  onMainChange,
  onSubChange,
  onSubSubChange,
}: Props) {
  const mainCategories = useMemo(
    () => getCategoryChildren(categories, null).filter((c) => c.level === 1 && c.status === "active"),
    [categories],
  );

  const subCategories = useMemo(
    () =>
      mainCategoryId
        ? getCategoryChildren(categories, mainCategoryId).filter((c) => c.status === "active")
        : [],
    [categories, mainCategoryId],
  );

  const subSubCategories = useMemo(
    () =>
      subCategoryId
        ? getCategoryChildren(categories, subCategoryId).filter((c) => c.status === "active")
        : [],
    [categories, subCategoryId],
  );

  const breadcrumb = useMemo(() => {
    const parts: string[] = [];
    const main = categories.find((c) => c.id === mainCategoryId);
    const sub = categories.find((c) => c.id === subCategoryId);
    const subSub = categories.find((c) => c.id === subSubCategoryId);
    if (main) parts.push(main.name);
    if (sub) parts.push(sub.name);
    if (subSub) parts.push(subSub.name);
    return parts.join(" › ");
  }, [categories, mainCategoryId, subCategoryId, subSubCategoryId]);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
      <p className="text-sm font-semibold text-ink">Course Category (3-level hierarchy)</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className={labelClass}>Main Category *</span>
          <select
            value={mainCategoryId}
            onChange={(e) => onMainChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Select main category</option>
            {mainCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Sub Category</span>
          <select
            value={subCategoryId}
            onChange={(e) => onSubChange(e.target.value)}
            className={selectClass}
            disabled={!mainCategoryId || subCategories.length === 0}
          >
            <option value="">
              {!mainCategoryId ? "Select main first" : subCategories.length === 0 ? "No sub categories" : "Select sub category"}
            </option>
            {subCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Sub-Sub Category</span>
          <select
            value={subSubCategoryId}
            onChange={(e) => onSubSubChange(e.target.value)}
            className={selectClass}
            disabled={!subCategoryId || subSubCategories.length === 0}
          >
            <option value="">
              {!subCategoryId ? "Select sub first" : subSubCategories.length === 0 ? "No sub-sub categories" : "Select sub-sub category"}
            </option>
            {subSubCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      </div>
      {breadcrumb && (
        <p className={helperClass}>
          Selected path: <span className="font-semibold text-ink">{breadcrumb}</span>
        </p>
      )}
    </div>
  );
}
