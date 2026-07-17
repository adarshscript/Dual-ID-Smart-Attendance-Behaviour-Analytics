const ADMIN_PASSWORD_KEY = "dias-admin-password";
const ADMIN_SESSION_KEY = "dias-admin-session";
const STUDENT_SESSION_KEY = "dias-student-session";

export const ADMIN_DEFAULT_USERNAME = "admin";
export const ADMIN_DEFAULT_PASSWORD = "dias2024";
export const ADMIN_RESET_SECRET = "DIAS-ADMIN-RESET-8055";

export function getAdminPassword() {
  if (typeof window === "undefined") return ADMIN_DEFAULT_PASSWORD;
  return localStorage.getItem(ADMIN_PASSWORD_KEY) || ADMIN_DEFAULT_PASSWORD;
}

export function setAdminPassword(password: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_PASSWORD_KEY, password);
}

export function setAdminSession(value: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_SESSION_KEY, value ? "1" : "0");
}

export function getAdminSession() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_SESSION_KEY) === "1";
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

export function getStudentPassword(roll: string) {
  return roll;
}

export function setStudentSession(roll: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STUDENT_SESSION_KEY, roll);
}

export function getStudentSession() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STUDENT_SESSION_KEY) || "";
}

export function clearStudentSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STUDENT_SESSION_KEY);
}
