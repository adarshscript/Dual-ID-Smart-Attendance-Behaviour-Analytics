import {
  AttendanceFilters,
  AttendanceLog,
  HolidayRecord,
  LeaveRequestRecord,
  StudentRecord
} from "@/lib/types";

const INSTITUTE_NAME = "PRASAD INSTITUTE OF TECHNOLOGY, JAUNPUR";

export function downloadAttendanceCsv(rows: AttendanceLog[]) {
  const header = ["Roll", "Name", "DateTime", "Status", "Duration"];
  const lines = rows.map((row) =>
    [row.roll, row.name, row.datetime, row.status, row.durationLabel || ""].map(csvEscape).join(",")
  );
  const csv = [header.join(","), ...lines].join("\n");
  downloadCsvFile(csv, "dias-attendance-export.csv");
}

export function downloadAdvancedAttendanceCsv({
  students,
  logs,
  holidays,
  leaveRequests,
  filters
}: {
  students: StudentRecord[];
  logs: AttendanceLog[];
  holidays: HolidayRecord[];
  leaveRequests: LeaveRequestRecord[];
  filters: AttendanceFilters;
}) {
  const todayKey = getLocalDateKey(new Date());
  const fallbackStart = getEarliestKnownDate(logs, holidays, leaveRequests) || todayKey;
  const fallbackEnd = getLatestKnownDate(logs, holidays, leaveRequests) || todayKey;

  let fromKey = filters.from || fallbackStart;
  let toKey = filters.to || fallbackEnd;

  if (fromKey > toKey) {
    [fromKey, toKey] = [toKey, fromKey];
  }

  const searchValue = filters.search.trim().toLowerCase();
  const selectedStudents = [...students]
    .filter((student) => {
      if (!searchValue) return true;
      return (
        student.name.toLowerCase().includes(searchValue) ||
        student.roll.toLowerCase().includes(searchValue)
      );
    })
    .sort(compareStudentsByRoll);

  const rangeLogs = logs.filter((log) => {
    const dateKey = getDateKey(log.datetime);
    return dateKey >= fromKey && dateKey <= toKey;
  });

  const holidaySet = new Set(
    holidays
      .map((holiday) => holiday.date)
      .filter((date) => date >= fromKey && date <= toKey)
  );

  const leaveMap = buildAcceptedLeaveMap(leaveRequests, fromKey, toKey);
  const attendanceMap = buildStudentAttendanceMap(rangeLogs);

  const rows = selectedStudents.map((student, index) => {
    const studentLeaveSet = leaveMap.get(String(student.roll || "").trim()) || new Set<string>();
    const studentAttendance = attendanceMap.get(String(student.roll || "").trim()) || new Map();

    let totalAttendance = 0;
    let earnedAttendance = 0;

    for (const dateKey of enumerateDateRange(fromKey, toKey)) {
      const date = parseDateKey(dateKey);
      if (isSunday(date) || holidaySet.has(dateKey) || studentLeaveSet.has(dateKey)) {
        continue;
      }

      totalAttendance += 1;
      const dayRecord = studentAttendance.get(dateKey);
      if (dayRecord?.hasEntry && dayRecord?.hasExit) {
        earnedAttendance += 1;
      } else if (dayRecord?.hasEntry) {
        earnedAttendance += 0.5;
      }
    }

    const percentage = totalAttendance
      ? Math.round((earnedAttendance / totalAttendance) * 100)
      : 0;

    return [
      index + 1,
      student.roll,
      student.name,
      formatCount(totalAttendance),
      formatCount(earnedAttendance),
      `${percentage}%`
    ];
  });

  const csvLines = [
    csvEscape(INSTITUTE_NAME),
    csvEscape(`FROM - ${formatDisplayDate(fromKey)}`),
    csvEscape(`TO - ${formatDisplayDate(toKey)}`),
    "",
    [
      "S.No.",
      "Roll no.",
      "Student Name",
      "Total Att.",
      "Attendance",
      "Attendance Percentage"
    ].map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(","))
  ];

  downloadCsvFile(csvLines.join("\n"), "dias-attendance-advanced-export.csv");
  return rows.length;
}

function downloadCsvFile(content: string, fileName: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
}

function csvEscape(value: string | number) {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function normalizeStatus(status: string) {
  return status?.trim().toUpperCase() === "ENTRY" ? "ENTRY" : "EXIT";
}

function getDateKey(datetime: string) {
  return String(datetime || "").slice(0, 10);
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDisplayDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-");
  return `${day}/${month}/${year}`;
}

function enumerateDateRange(fromKey: string, toKey: string) {
  const result: string[] = [];
  const current = parseDateKey(fromKey);
  const last = parseDateKey(toKey);

  while (current <= last) {
    result.push(getLocalDateKey(current));
    current.setDate(current.getDate() + 1);
  }

  return result;
}

function isSunday(date: Date) {
  return date.getDay() === 0;
}

function formatCount(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function compareStudentsByRoll(a: StudentRecord, b: StudentRecord) {
  const aRoll = String(a.roll || "").trim();
  const bRoll = String(b.roll || "").trim();
  const aNumber = Number(aRoll);
  const bNumber = Number(bRoll);

  if (!Number.isNaN(aNumber) && !Number.isNaN(bNumber) && aNumber !== bNumber) {
    return aNumber - bNumber;
  }

  return aRoll.localeCompare(bRoll, undefined, { numeric: true, sensitivity: "base" });
}

function getEarliestKnownDate(
  logs: AttendanceLog[],
  holidays: HolidayRecord[],
  leaveRequests: LeaveRequestRecord[]
) {
  const dates = [
    ...logs.map((log) => getDateKey(log.datetime)),
    ...holidays.map((holiday) => holiday.date),
    ...leaveRequests.map((request) => request.date)
  ].filter(Boolean);

  return dates.sort()[0] || "";
}

function getLatestKnownDate(
  logs: AttendanceLog[],
  holidays: HolidayRecord[],
  leaveRequests: LeaveRequestRecord[]
) {
  const dates = [
    ...logs.map((log) => getDateKey(log.datetime)),
    ...holidays.map((holiday) => holiday.date),
    ...leaveRequests.map((request) => request.date)
  ].filter(Boolean);

  return dates.sort().at(-1) || "";
}

function buildAcceptedLeaveMap(
  leaveRequests: LeaveRequestRecord[],
  fromKey: string,
  toKey: string
) {
  const byRoll = new Map<string, Set<string>>();

  leaveRequests
    .filter(
      (request) =>
        request.status === "ACCEPTED" &&
        request.date >= fromKey &&
        request.date <= toKey
    )
    .forEach((request) => {
      const roll = String(request.roll || "").trim();
      const current = byRoll.get(roll) || new Set<string>();
      current.add(request.date);
      byRoll.set(roll, current);
    });

  return byRoll;
}

function buildStudentAttendanceMap(logs: AttendanceLog[]) {
  const byStudent = new Map<
    string,
    Map<string, { hasEntry: boolean; hasExit: boolean }>
  >();

  logs.forEach((log) => {
    const roll = String(log.roll || "").trim();
    const dateKey = getDateKey(log.datetime);
    const studentDays = byStudent.get(roll) || new Map<string, { hasEntry: boolean; hasExit: boolean }>();
    const current = studentDays.get(dateKey) || { hasEntry: false, hasExit: false };

    if (normalizeStatus(log.status) === "ENTRY") {
      current.hasEntry = true;
    } else {
      current.hasExit = true;
    }

    studentDays.set(dateKey, current);
    byStudent.set(roll, studentDays);
  });

  return byStudent;
}
