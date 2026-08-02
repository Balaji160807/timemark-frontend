export type Session = {
  token: string;
  username: string;
  fullName: string;
  role: "EMPLOYEE" | "HR" | "MANAGER" | "ADMIN";
};

const KEY = "timemark_session";

export function saveSession(session: Session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export function isBackOffice(role: Session["role"]) {
  return role === "HR" || role === "MANAGER" || role === "ADMIN";
}
