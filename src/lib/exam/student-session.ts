const KEY = "nbg-student";

export type StudentSession = {
  id: string;
  name: string;
  email: string;
};

export function getStudentSession(): StudentSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as StudentSession;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveStudentSession(session: StudentSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearStudentSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function isLoggedIn() {
  return Boolean(getStudentSession()?.id);
}

export async function syncSessionFromServer() {
  if (typeof window === "undefined") return null;
  try {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    if (!response.ok) {
      clearStudentSession();
      return null;
    }
    const json = await response.json();
    if (!json.success || !json.data) {
      clearStudentSession();
      return null;
    }
    const session: StudentSession = {
      id: json.data.id,
      name: json.data.name,
      email: json.data.email,
    };
    saveStudentSession(session);
    return session;
  } catch {
    return getStudentSession();
  }
}

export async function logoutStudent() {
  await fetch("/api/auth/logout", { method: "POST" });
  clearStudentSession();
  window.dispatchEvent(new Event("nbg-auth-change"));
}
