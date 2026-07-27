const STORAGE_KEY = "nbg_instructor_session";

export type InstructorSession = {
  id: string;
  name: string;
  email?: string;
  instructorId?: string;
};

const DEFAULT: InstructorSession = {
  id: "",
  name: "Instructor",
};

export function getInstructorSession(): InstructorSession {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
}

export function setInstructorSession(session: InstructorSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export async function resolveInstructorSession(): Promise<InstructorSession> {
  if (typeof window === "undefined") return DEFAULT;
  const existing = getInstructorSession();
  if (existing.id && existing.instructorId) return existing;

  try {
    const res = await fetch("/api/admin/instructors?status=active");
    const json = await res.json();
    const instructors = json.data ?? [];
    const linked = instructors.find((i: { userId?: string }) => i.userId) ?? instructors[0];
    if (linked) {
      const session: InstructorSession = {
        id: linked.userId ?? linked.id,
        instructorId: linked.id,
        name: linked.name,
        email: linked.email,
      };
      setInstructorSession(session);
      return session;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT;
}
