export type AttendanceStatus = "ENTRY" | "EXIT";

export type StudentRecord = {
  id: string;
  name: string;
  roll: string;
  department: string;
  email?: string;
  phone?: string;
  rfidTag?: string;
  fingerprintId?: string;
  createdAt?: string;
  isPresent?: boolean;
  attendancePercentage: number;
  monthlyAttendancePercentage?: number;
  yearlyAttendancePercentage?: number;
  enrolledAtLabel: string;
};

export type AttendanceLog = {
  id: string;
  name: string;
  roll: string;
  datetime: string;
  status: AttendanceStatus;
  durationLabel?: string;
};

export type HolidayRecord = {
  id: string;
  date: string;
  label: string;
};

export type LeaveRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";

export type LeaveRequestRecord = {
  id: string;
  studentName: string;
  roll: string;
  department: string;
  reason: string;
  date: string;
  status: LeaveRequestStatus;
  adminViewed?: boolean;
  createdAt: string;
  resolvedAt?: string;
};

export type NotificationRecord = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  targetRoll?: string;
};

export type AttendanceFilters = {
  search: string;
  from: string;
  to: string;
  status: "ALL" | "ADVANCE" | AttendanceStatus;
};

export type BotContext = {
  totalStudents: number;
  presentCount: number;
  absentStudents: string[];
  topStudents: StudentRecord[];
  highestAttendanceStudent?: StudentRecord;
  lowestAttendanceStudent?: StudentRecord;
  students: StudentRecord[];
  logs: AttendanceLog[];
};
