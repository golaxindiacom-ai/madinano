import { randomUUID } from "crypto";
import { readDb, writeDb } from "./db";
import {
  buildCategoryTree,
  flattenCategoryTree,
  normalizeCategory,
  slugify,
  validateCategoryParent,
  type CategoryTreeNode,
} from "./categories";
import type { AdminDatabase, Category, CategoryDetailPayload, CategoryInput, CategoryLevel, CategoryStats, Course } from "./types";

const now = () => new Date().toISOString();

function normalizeCategories(db: AdminDatabase) {
  return db.categories.map((c) => normalizeCategory(c as unknown as Record<string, unknown>));
}

export function getCategoryBranchIds(categories: Category[], categoryId: string): Set<string> {
  const ids = new Set<string>([categoryId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const cat of categories) {
      if (cat.parentId && ids.has(cat.parentId) && !ids.has(cat.id)) {
        ids.add(cat.id);
        changed = true;
      }
    }
  }
  return ids;
}

function courseCategoryIds(course: Course): string[] {
  return [course.mainCategoryId, course.subCategoryId, course.subSubCategoryId, course.categoryId].filter(
    Boolean,
  ) as string[];
}

export function countCoursesInBranch(db: AdminDatabase, categoryId: string): number {
  const categories = normalizeCategories(db);
  const branchIds = getCategoryBranchIds(categories, categoryId);
  return db.courses.filter((course) =>
    courseCategoryIds(course as Course).some((id) => branchIds.has(id)),
  ).length;
}

export function recomputeCategoryCourseCounts(db: AdminDatabase) {
  const categories = normalizeCategories(db);
  for (const cat of categories) {
    const count = countCoursesInBranch(db, cat.id);
    const idx = db.categories.findIndex((c) => c.id === cat.id);
    if (idx !== -1) {
      db.categories[idx] = { ...db.categories[idx], courseCount: count };
    }
  }
}

export async function getCategoryStats(): Promise<CategoryStats> {
  const db = await readDb();
  recomputeCategoryCourseCounts(db);
  const categories = normalizeCategories(db);
  const uniqueCourseIds = new Set(db.courses.map((c) => c.id));
  return {
    total: categories.length,
    active: categories.filter((c) => c.status === "active").length,
    inactive: categories.filter((c) => c.status === "inactive").length,
    level1: categories.filter((c) => c.level === 1).length,
    level2: categories.filter((c) => c.level === 2).length,
    level3: categories.filter((c) => c.level === 3).length,
    totalCourses: uniqueCourseIds.size,
  };
}

export type CategoryTreePayload = {
  tree: CategoryTreeNode[];
  flat: CategoryTreeNode[];
  categories: Category[];
};

export async function getCategoryTreeData(): Promise<CategoryTreePayload> {
  const db = await readDb();
  recomputeCategoryCourseCounts(db);
  await writeDb(db);
  const categories = normalizeCategories(db);
  const tree = buildCategoryTree(categories);
  const flat = flattenCategoryTree(tree);
  return { tree, flat, categories };
}

function validateInput(
  input: CategoryInput,
  categories: Category[],
  selfId?: string,
): string | null {
  if (!input.name?.trim()) return "Category name is required";
  const level = Number(input.level ?? 1) as CategoryLevel;
  const parentId = input.parentId ?? null;
  const parentErr = validateCategoryParent(categories, parentId, level, selfId);
  if (parentErr) return parentErr;
  const slug = (input.slug?.trim() || slugify(input.name)).toLowerCase();
  if (!slug) return "Slug is required";
  const slugTaken = categories.some(
    (c) => c.slug === slug && c.id !== selfId,
  );
  if (slugTaken) return `Slug "${slug}" is already in use`;
  if (!["active", "inactive"].includes(input.status)) return "Invalid status";
  return null;
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const db = await readDb();
  const categories = normalizeCategories(db);
  const err = validateInput(input, categories);
  if (err) throw new Error(err);

  const ts = now();
  const level = Number(input.level ?? 1) as CategoryLevel;
  const category: Category = {
    id: randomUUID(),
    name: input.name.trim(),
    slug: (input.slug?.trim() || slugify(input.name)).toLowerCase(),
    description: input.description?.trim() || undefined,
    status: input.status,
    order: Number(input.order ?? 0),
    level,
    parentId: level === 1 ? null : input.parentId ?? null,
    courseCount: 0,
    createdAt: ts,
    updatedAt: ts,
  };

  db.categories.unshift(category);
  recomputeCategoryCourseCounts(db);
  await writeDb(db);
  return normalizeCategory(db.categories.find((c) => c.id === category.id)! as unknown as Record<string, unknown>);
}

export async function updateCategory(id: string, input: CategoryInput): Promise<Category | null> {
  const db = await readDb();
  const idx = db.categories.findIndex((c) => c.id === id);
  if (idx === -1) return null;

  const categories = normalizeCategories(db);
  const existing = categories[idx];
  const err = validateInput(input, categories, id);
  if (err) throw new Error(err);

  const level = Number(input.level ?? existing.level) as CategoryLevel;
  const children = categories.filter((c) => c.parentId === id);
  if (children.length > 0 && level !== existing.level) {
    throw new Error("Cannot change level while sub-categories exist");
  }

  const ts = now();
  db.categories[idx] = {
    ...db.categories[idx],
    name: input.name.trim(),
    slug: (input.slug?.trim() || slugify(input.name)).toLowerCase(),
    description: input.description?.trim() || undefined,
    status: input.status,
    order: Number(input.order ?? existing.order),
    level,
    parentId: level === 1 ? null : input.parentId ?? null,
    updatedAt: ts,
  };

  recomputeCategoryCourseCounts(db);
  await writeDb(db);
  return normalizeCategory(db.categories[idx] as unknown as Record<string, unknown>);
}

export async function deleteCategory(id: string): Promise<boolean> {
  const db = await readDb();
  const categories = normalizeCategories(db);
  const cat = categories.find((c) => c.id === id);
  if (!cat) return false;

  const children = categories.filter((c) => c.parentId === id);
  if (children.length > 0) {
    throw new Error("Delete sub-categories first before removing this category");
  }

  const courseCount = countCoursesInBranch(db, id);
  if (courseCount > 0) {
    throw new Error(`Cannot delete — ${courseCount} course(s) use this category`);
  }

  db.categories = db.categories.filter((c) => c.id !== id);
  recomputeCategoryCourseCounts(db);
  await writeDb(db);
  return true;
}

export async function getCategoryDetail(id: string): Promise<CategoryDetailPayload | null> {
  const db = await readDb();
  recomputeCategoryCourseCounts(db);
  const categories = normalizeCategories(db);
  const cat = categories.find((c) => c.id === id);
  if (!cat) return null;

  const tree = buildCategoryTree(categories);
  const flat = flattenCategoryTree(tree);
  const node = flat.find((n) => n.id === id);
  const branchIds = getCategoryBranchIds(categories, id);
  const courses = db.courses.filter((course) =>
    courseCategoryIds(course as Course).some((cid) => branchIds.has(cid)),
  ) as Course[];

  return {
    category: cat,
    breadcrumb: node?.breadcrumb ?? cat.name,
    children: categories.filter((c) => c.parentId === id),
    courses,
    childCount: categories.filter((c) => c.parentId === id).length,
  };
}
