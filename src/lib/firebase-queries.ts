import {
  onValue,
  push,
  ref,
  remove,
  set,
  update
} from "firebase/database";
import { database } from "@/lib/firebase";
import {
  AttendanceLog,
  HolidayRecord,
  LeaveRequestRecord,
  LeaveRequestStatus,
  NotificationRecord,
  StudentRecord
} from "@/lib/types";

function objectToArray<T>(value: Record<string, Omit<T, "id">> | null): T[] {
  if (!value) return [];
  return Object.entries(value).map(([id, item]) => ({ id, ...(item as object) } as T));
}

function normalizeStudentRecord(student: StudentRecord): StudentRecord {
  const fallbackRoll =
    String(student.roll || student.id || "").trim() || String(student.name || "").trim();

  return {
    ...student,
    name: String(student.name || "").trim(),
    roll: fallbackRoll,
    department: String(student.department || "Computer Science").trim(),
    email: String(student.email || "").trim(),
    phone: String(student.phone || "").trim(),
    rfidTag: String(student.rfidTag || "").trim(),
    fingerprintId: String(student.fingerprintId || "").trim(),
    attendancePercentage: Number(student.attendancePercentage || 0),
    enrolledAtLabel: String(student.enrolledAtLabel || "")
  };
}

function normalizeAttendanceLog(log: AttendanceLog): AttendanceLog {
  return {
    ...log,
    name: String(log.name || "").trim(),
    roll: String(log.roll || "").trim(),
    datetime: String(log.datetime || "").trim(),
    status: String(log.status || "").trim().toUpperCase() === "ENTRY" ? "ENTRY" : "EXIT"
  };
}

export function onStudents(callback: (students: StudentRecord[]) => void) {
  const studentsRef = ref(database, "users");
  return onValue(studentsRef, (snapshot) => {
    const data = snapshot.val();
    callback(objectToArray<StudentRecord>(data).map(normalizeStudentRecord));
  });
}

export function onAttendanceLogs(callback: (logs: AttendanceLog[]) => void) {
  const attendanceRef = ref(database, "attendance");
  return onValue(attendanceRef, (snapshot) => {
    const data = snapshot.val();
    callback(objectToArray<AttendanceLog>(data).map(normalizeAttendanceLog));
  });
}

export function onHolidays(callback: (holidays: HolidayRecord[]) => void) {
  const holidaysRef = ref(database, "holidays");
  return onValue(holidaysRef, (snapshot) => {
    const data = snapshot.val();
    callback(objectToArray<HolidayRecord>(data));
  });
}

export function onLeaveRequests(callback: (requests: LeaveRequestRecord[]) => void) {
  const requestsRef = ref(database, "leaveRequests");
  return onValue(requestsRef, (snapshot) => {
    const data = snapshot.val();
    callback(objectToArray<LeaveRequestRecord>(data));
  });
}

export function onNotifications(callback: (notes: NotificationRecord[]) => void) {
  const notificationsRef = ref(database, "notifications");
  return onValue(notificationsRef, (snapshot) => {
    const data = snapshot.val() ?? {
      seed: {
        title: "Welcome to DIAS",
        message: "Your attendance and alerts will appear here.",
        createdAt: new Date().toISOString()
      }
    };
    callback(objectToArray<NotificationRecord>(data));
  });
}

export async function saveStudent(student: Partial<StudentRecord>) {
  const payload = {
    name: student.name || "",
    roll: student.roll || "",
    department: student.department || "General",
    email: student.email || "",
    phone: student.phone || "",
    rfidTag: student.rfidTag || "",
    fingerprintId: student.fingerprintId || "",
    createdAt: student.createdAt || new Date().toISOString()
  };

  if (student.id) {
    await update(ref(database, `users/${student.id}`), payload);
    return;
  }

  const node = push(ref(database, "users"));
  await set(node, payload);
}

export async function removeStudent(id: string) {
  await remove(ref(database, `users/${id}`));
}

export async function addHoliday(date: string, label: string) {
  const node = push(ref(database, "holidays"));
  await set(node, {
    date,
    label
  });
}

export async function removeHoliday(id: string) {
  await remove(ref(database, `holidays/${id}`));
}

export async function submitLeaveRequest(
  request: Omit<LeaveRequestRecord, "id" | "status" | "adminViewed" | "createdAt">
) {
  const node = push(ref(database, "leaveRequests"));
  await set(node, {
    ...request,
    status: "PENDING",
    adminViewed: false,
    createdAt: new Date().toISOString()
  });
}

export async function markLeaveRequestsViewed(ids: string[]) {
  await Promise.all(
    ids.map((id) => update(ref(database, `leaveRequests/${id}`), { adminViewed: true }))
  );
}

export async function updateLeaveRequestStatus(
  request: LeaveRequestRecord,
  status: LeaveRequestStatus
) {
  const notificationTitle =
    status === "ACCEPTED"
      ? "Leave Request Accepted"
      : status === "REJECTED"
        ? "Leave Request Rejected"
        : "Approved Leave Cancelled";

  const notificationMessage =
    status === "ACCEPTED"
      ? `Your leave request for ${request.date} has been accepted.`
      : status === "REJECTED"
        ? `Your leave request for ${request.date} has been rejected.`
        : `Your approved leave for ${request.date} has been cancelled by the admin.`;

  await update(ref(database, `leaveRequests/${request.id}`), {
    status,
    adminViewed: true,
    resolvedAt: new Date().toISOString()
  });

  const node = push(ref(database, "notifications"));
  await set(node, {
    targetRoll: request.roll,
    title: notificationTitle,
    message: notificationMessage,
    createdAt: new Date().toISOString()
  });
}
