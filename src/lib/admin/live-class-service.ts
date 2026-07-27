import { randomUUID } from "crypto";
import { readDb, writeDb } from "./db";
import { normalizeCourse } from "./course-builder";
import type {
  AdminDatabase,
  LiveClass,
  LiveClassDetailPayload,
  LiveClassInput,
  LiveClassListItem,
  LiveClassPlatform,
  LiveClassStats,
  PublicLiveClassItem,
} from "./types";

const now = () => new Date().toISOString();

const PLATFORM_LABELS: Record<LiveClassPlatform, string> = {
  google_meet: "Google Meet",
  zoom: "Zoom",
  youtube: "YouTube Live",
};

export function normalizeLiveClass(raw: Record<string, unknown>): LiveClass {
  return {
    id: String(raw.id),
    createdAt: String(raw.createdAt),
    updatedAt: String(raw.updatedAt),
    title: String(raw.title ?? ""),
    courseId: raw.courseId ? String(raw.courseId) : undefined,
    sectionId: raw.sectionId ? String(raw.sectionId) : undefined,
    instructorName: String(raw.instructorName ?? ""),
    description: raw.description ? String(raw.description) : undefined,
    scheduledAt: String(raw.scheduledAt ?? ""),
    duration: String(raw.duration ?? "1h"),
    enrolled: Number(raw.enrolled ?? 0),
    status: (raw.status as LiveClass["status"]) ?? "scheduled",
    platform: (raw.platform as LiveClassPlatform) ?? "google_meet",
    meetingUrl: raw.meetingUrl ? String(raw.meetingUrl) : undefined,
    meetingId: raw.meetingId ? String(raw.meetingId) : undefined,
    passcode: raw.passcode ? String(raw.passcode) : undefined,
    youtubeLiveUrl: raw.youtubeLiveUrl ? String(raw.youtubeLiveUrl) : undefined,
  };
}

export function getJoinUrl(live: LiveClass): string | undefined {
  if (live.platform === "youtube") return live.youtubeLiveUrl ?? live.meetingUrl;
  return live.meetingUrl;
}

function getSectionTitle(course: ReturnType<typeof normalizeCourse>, sectionId?: string) {
  if (!sectionId) return undefined;
  return course.curriculum.find((s) => s.id === sectionId)?.title;
}

function isUpcoming(live: LiveClass) {
  if (live.status === "cancelled" || live.status === "completed") return false;
  const scheduled = new Date(live.scheduledAt);
  return !Number.isNaN(scheduled.getTime()) && scheduled.getTime() >= Date.now();
}

function isPast(live: LiveClass) {
  if (live.status === "completed" || live.status === "cancelled") return true;
  const scheduled = new Date(live.scheduledAt);
  return !Number.isNaN(scheduled.getTime()) && scheduled.getTime() < Date.now();
}

function enrichLiveClass(db: AdminDatabase, live: LiveClass): LiveClassListItem {
  const courseRaw = live.courseId ? db.courses.find((c) => c.id === live.courseId) : undefined;
  const course = courseRaw
    ? normalizeCourse(courseRaw as unknown as Record<string, unknown>)
    : null;

  return {
    ...live,
    courseTitle: course?.title,
    sectionTitle: course ? getSectionTitle(course, live.sectionId) : undefined,
    platformLabel: PLATFORM_LABELS[live.platform] ?? live.platform,
    joinUrl: getJoinUrl(live),
    isUpcoming: isUpcoming(live),
    isPast: isPast(live),
  };
}

function resolveInstructorName(db: AdminDatabase, input: LiveClassInput): string {
  if (input.instructorName?.trim()) return input.instructorName.trim();
  if (input.courseId) {
    const courseRaw = db.courses.find((c) => c.id === input.courseId);
    if (courseRaw) {
      const course = normalizeCourse(courseRaw as unknown as Record<string, unknown>);
      const instructor = db.instructors.find((i) => i.id === course.instructorId);
      if (instructor?.name) return instructor.name;
    }
  }
  return "Instructor";
}

function validateInput(input: LiveClassInput, db: AdminDatabase, selfId?: string): string | null {
  if (!input.title?.trim()) return "Title is required";
  if (!input.scheduledAt) return "Schedule date & time is required";
  if (!input.duration?.trim()) return "Duration is required";
  if (!["google_meet", "zoom", "youtube"].includes(input.platform)) return "Invalid platform";
  if (!["scheduled", "live", "completed", "cancelled"].includes(input.status)) return "Invalid status";

  const scheduled = new Date(input.scheduledAt);
  if (Number.isNaN(scheduled.getTime())) return "Invalid schedule date";

  if (input.courseId) {
    const courseRaw = db.courses.find((c) => c.id === input.courseId);
    if (!courseRaw) return "Course not found";
    const course = normalizeCourse(courseRaw as unknown as Record<string, unknown>);
    if (input.sectionId) {
      const section = course.curriculum.find((s) => s.id === input.sectionId);
      if (!section) return "Section not found in selected course";
    }
  }

  if (input.platform === "youtube" && !input.youtubeLiveUrl?.trim() && !input.meetingUrl?.trim()) {
    return "YouTube Live URL or meeting URL is required";
  }
  if (input.platform !== "youtube" && !input.meetingUrl?.trim()) {
    return "Meeting URL is required";
  }

  if (selfId) {
    const existing = db.liveClasses.find((l) => l.id === selfId);
    if (!existing) return "Live class not found";
  }

  return null;
}

export type ListLiveClassesOptions = {
  search?: string;
  status?: LiveClass["status"] | "all";
  courseId?: string;
  platform?: LiveClassPlatform | "all";
  upcoming?: boolean;
};

export async function getLiveClassStats(): Promise<LiveClassStats> {
  const db = await readDb();
  const classes = db.liveClasses.map((l) =>
    normalizeLiveClass(l as unknown as Record<string, unknown>),
  );
  const courseIds = new Set(classes.map((l) => l.courseId).filter(Boolean));

  return {
    total: classes.length,
    scheduled: classes.filter((l) => l.status === "scheduled").length,
    live: classes.filter((l) => l.status === "live").length,
    completed: classes.filter((l) => l.status === "completed").length,
    cancelled: classes.filter((l) => l.status === "cancelled").length,
    upcoming: classes.filter((l) => isUpcoming(l)).length,
    totalEnrolled: classes.reduce((sum, l) => sum + l.enrolled, 0),
    coursesWithLiveClasses: courseIds.size,
  };
}

export async function listLiveClasses(
  options: ListLiveClassesOptions = {},
): Promise<LiveClassListItem[]> {
  const db = await readDb();
  let classes = db.liveClasses.map((l) =>
    normalizeLiveClass(l as unknown as Record<string, unknown>),
  );

  if (options.status && options.status !== "all") {
    classes = classes.filter((l) => l.status === options.status);
  }
  if (options.courseId) {
    classes = classes.filter((l) => l.courseId === options.courseId);
  }
  if (options.platform && options.platform !== "all") {
    classes = classes.filter((l) => l.platform === options.platform);
  }
  if (options.upcoming) {
    classes = classes.filter((l) => isUpcoming(l) || l.status === "live");
  }
  if (options.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    classes = classes.filter((l) => {
      const enriched = enrichLiveClass(db, l);
      return [l.title, l.instructorName, l.description, enriched.courseTitle].some((v) =>
        String(v ?? "").toLowerCase().includes(q),
      );
    });
  }

  return classes
    .map((l) => enrichLiveClass(db, l))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
}

export async function getLiveClassDetail(id: string): Promise<LiveClassDetailPayload | null> {
  const db = await readDb();
  const raw = db.liveClasses.find((l) => l.id === id);
  if (!raw) return null;

  const liveClass = enrichLiveClass(
    db,
    normalizeLiveClass(raw as unknown as Record<string, unknown>),
  );

  return {
    liveClass,
    courseTitle: liveClass.courseTitle,
    sectionTitle: liveClass.sectionTitle,
  };
}

export async function createLiveClass(input: LiveClassInput): Promise<LiveClassListItem> {
  const db = await readDb();
  const err = validateInput(input, db);
  if (err) throw new Error(err);

  const ts = now();
  const liveClass: LiveClass = {
    id: randomUUID(),
    title: input.title.trim(),
    courseId: input.courseId || undefined,
    sectionId: input.sectionId || undefined,
    instructorName: resolveInstructorName(db, input),
    description: input.description?.trim() || undefined,
    scheduledAt: new Date(input.scheduledAt).toISOString(),
    duration: input.duration.trim(),
    enrolled: 0,
    status: input.status,
    platform: input.platform,
    meetingUrl: input.meetingUrl?.trim() || undefined,
    meetingId: input.meetingId?.trim() || undefined,
    passcode: input.passcode?.trim() || undefined,
    youtubeLiveUrl: input.youtubeLiveUrl?.trim() || undefined,
    createdAt: ts,
    updatedAt: ts,
  };

  db.liveClasses.unshift(liveClass);
  await writeDb(db);

  const dbFresh = await readDb();
  return enrichLiveClass(dbFresh, liveClass);
}

export async function updateLiveClass(
  id: string,
  input: LiveClassInput,
): Promise<LiveClassListItem | null> {
  const db = await readDb();
  const err = validateInput(input, db, id);
  if (err) throw new Error(err);

  const idx = db.liveClasses.findIndex((l) => l.id === id);
  if (idx === -1) return null;

  const existing = normalizeLiveClass(db.liveClasses[idx] as unknown as Record<string, unknown>);
  const updated: LiveClass = {
    ...existing,
    title: input.title.trim(),
    courseId: input.courseId || undefined,
    sectionId: input.sectionId || undefined,
    instructorName: resolveInstructorName(db, input),
    description: input.description?.trim() || undefined,
    scheduledAt: new Date(input.scheduledAt).toISOString(),
    duration: input.duration.trim(),
    status: input.status,
    platform: input.platform,
    meetingUrl: input.meetingUrl?.trim() || undefined,
    meetingId: input.meetingId?.trim() || undefined,
    passcode: input.passcode?.trim() || undefined,
    youtubeLiveUrl: input.youtubeLiveUrl?.trim() || undefined,
    updatedAt: now(),
  };

  db.liveClasses[idx] = updated;
  await writeDb(db);

  const dbFresh = await readDb();
  return enrichLiveClass(dbFresh, updated);
}

export async function updateLiveClassStatus(
  id: string,
  status: LiveClass["status"],
): Promise<LiveClassListItem | null> {
  const db = await readDb();
  const idx = db.liveClasses.findIndex((l) => l.id === id);
  if (idx === -1) return null;

  const live = normalizeLiveClass(db.liveClasses[idx] as unknown as Record<string, unknown>);
  db.liveClasses[idx] = { ...live, status, updatedAt: now() };
  await writeDb(db);

  const dbFresh = await readDb();
  return enrichLiveClass(dbFresh, db.liveClasses[idx] as LiveClass);
}

export async function deleteLiveClass(id: string): Promise<boolean> {
  const db = await readDb();
  const before = db.liveClasses.length;
  db.liveClasses = db.liveClasses.filter((l) => l.id !== id);
  if (db.liveClasses.length === before) return false;
  await writeDb(db);
  return true;
}

export async function listCoursesForLiveClasses() {
  const db = await readDb();
  return db.courses
    .map((c) => normalizeCourse(c as unknown as Record<string, unknown>))
    .map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      curriculum: c.curriculum,
      instructorId: c.instructorId,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getPlatformOptions() {
  return Object.entries(PLATFORM_LABELS).map(([value, label]) => ({ value, label }));
}

function toPublicItem(live: LiveClassListItem): PublicLiveClassItem {
  return {
    id: live.id,
    title: live.title,
    instructorName: live.instructorName,
    description: live.description,
    courseTitle: live.courseTitle,
    scheduledAt: live.scheduledAt,
    duration: live.duration,
    enrolled: live.enrolled,
    status: live.status,
    platform: live.platform,
    platformLabel: live.platformLabel,
    joinUrl: live.joinUrl,
  };
}

export async function listPublicLiveClasses() {
  const db = await readDb();
  const classes = db.liveClasses
    .map((l) => enrichLiveClass(db, normalizeLiveClass(l as unknown as Record<string, unknown>)))
    .filter((l) => l.status !== "cancelled")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const publicItems = classes.map(toPublicItem);
  const featured =
    publicItems.find((l) => l.status === "live") ??
    publicItems.find((l) => l.status === "scheduled" && new Date(l.scheduledAt) >= new Date()) ??
    publicItems[0] ??
    null;

  const upcoming = publicItems.filter(
    (l) => l.status === "scheduled" || l.status === "live",
  );

  return { featured, upcoming, all: publicItems };
}
