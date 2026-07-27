import type { Category, CategoryLevel } from "./types";

export type CategoryTreeNode = Category & {
  children: CategoryTreeNode[];
  breadcrumb: string;
};

export function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [], breadcrumb: cat.name });
  }

  for (const cat of categories) {
    const node = map.get(cat.id)!;
    if (cat.parentId && map.has(cat.parentId)) {
      const parent = map.get(cat.parentId)!;
      node.breadcrumb = `${parent.breadcrumb} › ${cat.name}`;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: CategoryTreeNode[]) => {
    nodes.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);
  return roots;
}

export function flattenCategoryTree(tree: CategoryTreeNode[]): CategoryTreeNode[] {
  const out: CategoryTreeNode[] = [];
  const walk = (nodes: CategoryTreeNode[]) => {
    for (const n of nodes) {
      out.push(n);
      walk(n.children);
    }
  };
  walk(tree);
  return out;
}

export function getCategoryChildren(categories: Category[], parentId: string | null) {
  return categories
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export function getCategoryLevelLabel(level: CategoryLevel) {
  if (level === 1) return "Main Category";
  if (level === 2) return "Sub Category";
  return "Sub-Sub Category";
}

export function resolveCourseCategoryIds(
  mainCategoryId: string,
  subCategoryId?: string,
  subSubCategoryId?: string,
) {
  const leaf = subSubCategoryId || subCategoryId || mainCategoryId;
  return {
    mainCategoryId,
    subCategoryId: subCategoryId || undefined,
    subSubCategoryId: subSubCategoryId || undefined,
    categoryId: leaf,
  };
}

export function discountPercent(originalPrice: number, sellingPrice: number) {
  if (!originalPrice || originalPrice <= sellingPrice) return 0;
  return Math.round(((originalPrice - sellingPrice) / originalPrice) * 100);
}

export function normalizeCategory(raw: Record<string, unknown>): Category {
  const level = Number(raw.level ?? 1) as CategoryLevel;
  return {
    id: String(raw.id),
    createdAt: String(raw.createdAt),
    updatedAt: String(raw.updatedAt),
    name: String(raw.name ?? ""),
    slug: String(raw.slug ?? ""),
    parentId: raw.parentId ? String(raw.parentId) : null,
    level: (level === 2 || level === 3 ? level : 1) as CategoryLevel,
    description: raw.description ? String(raw.description) : undefined,
    order: Number(raw.order ?? 0),
    courseCount: Number(raw.courseCount ?? 0),
    status: (raw.status as Category["status"]) ?? "active",
  };
}

export function validateCategoryParent(
  categories: Category[],
  parentId: string | null,
  level: CategoryLevel,
  selfId?: string,
) {
  if (level === 1) {
    if (parentId) return "Main category cannot have a parent";
    return null;
  }
  if (!parentId) return "Sub category must have a parent";
  const parent = categories.find((c) => c.id === parentId);
  if (!parent) return "Parent category not found";
  if (selfId && parentId === selfId) return "Category cannot be its own parent";
  if (parent.level !== ((level - 1) as CategoryLevel)) {
    return `Parent must be a ${getCategoryLevelLabel((level - 1) as CategoryLevel)}`;
  }
  return null;
}
