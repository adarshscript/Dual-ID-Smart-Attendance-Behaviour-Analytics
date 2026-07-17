import { format } from "date-fns";
import { AttendanceLog, BotContext, HolidayRecord, LeaveRequestRecord, StudentRecord } from "@/lib/types";

function getTimestamp(datetime: string) {
  if (!datetime) return 0;

  const normalized = datetime.includes("T") ? datetime : datetime.replace(" ", "T");
  const timestamp = new Date(normalized).getTime();

  if (!Number.isNaN(timestamp)) {
    return timestamp;
  }

  const parts = datetime.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/
  );

  if (!parts) return 0;

  const [, year, month, day, hour, minute, second = "00"] = parts;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  ).getTime();
}

function normalizeStatus(status: string) {
  return status?.trim().toUpperCase() === "ENTRY" ? "ENTRY" : "EXIT";
}

function compareLogs(a: AttendanceLog, b: AttendanceLog) {
  const timeDiff = getTimestamp(a.datetime) - getTimestamp(b.datetime);
  if (timeDiff !== 0) return timeDiff;

  const aId = Number(String(a.id || "").replace(/\D/g, ""));
  const bId = Number(String(b.id || "").replace(/\D/g, ""));
  if (!Number.isNaN(aId) && !Number.isNaN(bId) && aId !== bId) {
    return aId - bId;
  }

  if (a.status === b.status) return 0;
  return a.status === "ENTRY" ? -1 : 1;
}

function getDateKey(datetime: string) {
  return datetime.slice(0, 10);
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDurationMinutes(totalMinutes: number) {
  if (totalMinutes <= 0) return "0 mins";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) return `${minutes} mins`;
  if (!minutes) return hours === 1 ? "1 hr" : `${hours} hrs`;

  const hourLabel = hours === 1 ? "1 hr" : `${hours} hrs`;
  const minuteLabel = minutes === 1 ? "1 min" : `${minutes} mins`;
  return `${hourLabel} ${minuteLabel}`;
}

function normalizeText(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function getStudentKeys(student: StudentRecord) {
  const keys = new Set<string>();
  const roll = String(student.roll || "").trim();
  const id = String(student.id || "").trim();
  const name = normalizeText(student.name);

  if (roll) keys.add(`roll:${roll}`);
  if (id) keys.add(`roll:${id}`);
  if (name) keys.add(`name:${name}`);

  return Array.from(keys);
}

function mapLatestPresence(logs: AttendanceLog[]) {
  const latest = new Map<string, AttendanceLog>();

  logs.forEach((log) => {
    const normalizedLog: AttendanceLog = {
      ...log,
      status: normalizeStatus(log.status)
    };
    const keys = [
      `roll:${String(log.roll || "").trim()}`,
      `name:${normalizeText(log.name)}`
    ].filter((key) => !key.endsWith(":"));

    keys.forEach((key) => {
      const previous = latest.get(key);
      if (!previous || compareLogs(previous, normalizedLog) < 0) {
        latest.set(key, normalizedLog);
      }
    });
  });

  return latest;
}

function groupLogsByStudent(logs: AttendanceLog[]) {
  const grouped = new Map<string, AttendanceLog[]>();

  logs.forEach((log) => {
    const keys = [
      `roll:${String(log.roll || "").trim()}`,
      `name:${normalizeText(log.name)}`
    ].filter((key) => !key.endsWith(":"));

    keys.forEach((key) => {
      const existing = grouped.get(key) || [];
      existing.push({
        ...log,
        status: normalizeStatus(log.status)
      });
      grouped.set(key, existing);
    });
  });

  return grouped;
}

export function enhanceStudents(
  students: StudentRecord[],
  logs: AttendanceLog[],
  holidays: HolidayRecord[] = []
) {
  const latestPresence = mapLatestPresence(logs);
  const groupedLogs = groupLogsByStudent(logs);
  const todayKey = getLocalDateKey(new Date());

  return students.map((student) => {
    const studentKeys = getStudentKeys(student);
    const matchedLogs = studentKeys.flatMap((key) => groupedLogs.get(key) || []);
    const uniqueLogs = Array.from(
      new Map(matchedLogs.map((log) => [log.id, log])).values()
    );
    const studentLogs = uniqueLogs.sort(
      (a, b) => getTimestamp(a.datetime) - getTimestamp(b.datetime)
    );
    const entryCount = studentLogs.filter(
      (log) => normalizeStatus(log.status) === "ENTRY"
    ).length;
    const totalSessions = Math.max(studentLogs.length, 1);
    const percentage = studentLogs.length
      ? Math.min(100, Math.round((entryCount / totalSessions) * 100))
      : 0;
    const monthlyStats = calculateAttendanceStats(studentLogs, holidays);
    const latest = studentKeys
      .map((key) => latestPresence.get(key))
      .filter(Boolean)
      .sort((a, b) => compareLogs(b as AttendanceLog, a as AttendanceLog))[0];
    const isPresentToday =
      normalizeStatus(latest?.status || "EXIT") === "ENTRY" &&
      getDateKey(latest?.datetime || "") === todayKey;

    return {
      ...student,
      isPresent: isPresentToday,
      attendancePercentage: percentage,
      monthlyAttendancePercentage: monthlyStats.monthlyPercentage,
      yearlyAttendancePercentage: monthlyStats.yearlyPercentage,
      enrolledAtLabel: student.createdAt
        ? format(new Date(student.createdAt), "MMM yyyy")
        : format(new Date(), "MMM yyyy")
    };
  });
}

export function enhanceAttendanceRows(logs: AttendanceLog[]) {
  const grouped = new Map<
    string,
    {
      entry?: AttendanceLog;
      exit?: AttendanceLog;
    }
  >();

  logs.forEach((log) => {
    const normalizedLog: AttendanceLog = {
      ...log,
      status: normalizeStatus(log.status)
    };
    const dateKey = getDateKey(normalizedLog.datetime);
    const groupKey = `${String(normalizedLog.roll || "").trim()}__${dateKey}`;
    const current = grouped.get(groupKey) || {};

    if (normalizedLog.status === "ENTRY") {
      if (!current.entry || compareLogs(normalizedLog, current.entry) < 0) {
        current.entry = normalizedLog;
      }
    } else if (!current.exit || compareLogs(normalizedLog, current.exit) > 0) {
      current.exit = normalizedLog;
    }

    grouped.set(groupKey, current);
  });

  const rows = Array.from(grouped.values()).flatMap(({ entry, exit }) => {
    const dayRows: AttendanceLog[] = [];

    if (exit) {
      let durationLabel = "-";
      if (entry) {
        const durationMinutes = Math.max(
          0,
          Math.round((getTimestamp(exit.datetime) - getTimestamp(entry.datetime)) / 60000)
        );
        durationLabel = formatDurationMinutes(durationMinutes);
      }

      dayRows.push({
        ...exit,
        durationLabel
      });
    }

    if (entry) {
      dayRows.push({
        ...entry,
        durationLabel: "-"
      });
    }

    return dayRows;
  });

  return rows.sort((a, b) => {
    const aDateKey = getDateKey(a.datetime);
    const bDateKey = getDateKey(b.datetime);

    if (aDateKey !== bDateKey) {
      return getTimestamp(b.datetime) - getTimestamp(a.datetime);
    }

    if (a.roll !== b.roll) {
      return a.roll.localeCompare(b.roll);
    }

    if (a.status !== b.status) {
      return a.status === "EXIT" ? -1 : 1;
    }

    return getTimestamp(b.datetime) - getTimestamp(a.datetime);
  });
}

export function buildDashboardMetrics(students: StudentRecord[]) {
  const totalStudents = students.length;
  const presentStudents = students.filter((student) => student.isPresent).length;
  const absentStudents = Math.max(totalStudents - presentStudents, 0);

  return {
    totalStudents,
    presentStudents,
    absentStudents,
    attendanceRate: totalStudents
      ? Math.round((presentStudents / totalStudents) * 100)
      : 0
  };
}

export function buildTopStudents(students: StudentRecord[]) {
  return [...students]
    .sort(
      (a, b) =>
        (b.monthlyAttendancePercentage || 0) - (a.monthlyAttendancePercentage || 0)
    )
    .slice(0, 3);
}

export function buildAnalytics(students: StudentRecord[], logs: AttendanceLog[]) {
  const totalStudents = students.length;
  const now = new Date();
  const todayKey = getLocalDateKey(now);
  const dailyEntryMap = new Map<string, Set<string>>();

  logs.forEach((log) => {
    if (normalizeStatus(log.status) !== "ENTRY") return;
    const dateKey = getDateKey(log.datetime);
    const current = dailyEntryMap.get(dateKey) || new Set<string>();
    current.add(String(log.roll || "").trim());
    dailyEntryMap.set(dateKey, current);
  });

  const dailyTrend = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - index));
    const dateKey = getLocalDateKey(date);
    const present = dailyEntryMap.get(dateKey)?.size || 0;

    return {
      date: format(date, "MMM dd"),
      present,
      absent: Math.max(totalStudents - present, 0)
    };
  });

  const todayPresentRolls = dailyEntryMap.get(todayKey) || new Set<string>();
  const departmentMap = new Map<string, { name: string; count: number; present: number }>();
  students.forEach((student) => {
    const current = departmentMap.get(student.department) || {
      name: student.department,
      count: 0,
      present: 0
    };
    current.count += 1;
    if (todayPresentRolls.has(String(student.roll || "").trim())) {
      current.present += 1;
    }
    departmentMap.set(student.department, current);
  });

  const departmentDistribution = Array.from(departmentMap.values()).map((item) => ({
    ...item,
    attendance: item.count ? Math.round((item.present / item.count) * 100) : 0
  }));

  return {
    dailyTrend,
    departmentDistribution
  };
}

function buildHolidaySet(holidays: HolidayRecord[]) {
  return new Set(holidays.map((holiday) => holiday.date));
}

function buildAcceptedLeaveSet(leaveRequests: LeaveRequestRecord[] = []) {
  return new Set(
    leaveRequests
      .filter((request) => request.status === "ACCEPTED")
      .map((request) => request.date)
  );
}

function isSunday(date: Date) {
  return date.getDay() === 0;
}

function buildDailyAttendanceMap(logs: AttendanceLog[]) {
  const byDate = new Map<
    string,
    {
      entries: AttendanceLog[];
      exits: AttendanceLog[];
    }
  >();

  logs.forEach((log) => {
    const dateKey = getDateKey(log.datetime);
    const current = byDate.get(dateKey) || { entries: [], exits: [] };
    if (normalizeStatus(log.status) === "ENTRY") current.entries.push(log);
    else current.exits.push(log);
    byDate.set(dateKey, current);
  });

  return byDate;
}

function getDayAttendanceState(
  dateKey: string,
  dayLogs: { entries: AttendanceLog[]; exits: AttendanceLog[] } | undefined,
  holidaySet: Set<string>,
  leaveSet: Set<string>,
  date: Date,
  now: Date
) {
  if (holidaySet.has(dateKey) || isSunday(date)) return "holiday" as const;
  if (leaveSet.has(dateKey)) return "leave" as const;
  if (date > now) return "neutral" as const;
  if (!dayLogs || (!dayLogs.entries.length && !dayLogs.exits.length)) return "absent" as const;
  if (dayLogs.entries.length && dayLogs.exits.length) return "present" as const;
  if (dayLogs.entries.length) return "half" as const;
  return "absent" as const;
}

export function calculateAttendanceStats(
  logs: AttendanceLog[],
  holidays: HolidayRecord[],
  leaveRequests: LeaveRequestRecord[] = [],
  referenceDate = new Date()
) {
  const now = new Date(referenceDate);
  const year = now.getFullYear();
  const month = now.getMonth();
  const holidaySet = buildHolidaySet(holidays);
  const leaveSet = buildAcceptedLeaveSet(leaveRequests);
  const dayMap = buildDailyAttendanceMap(logs);

  let monthlyWorkingDays = 0;
  let monthlyEarnedDays = 0;
  let monthlyPresentDays = 0;
  let monthlyHalfDays = 0;
  let monthlyExcludedDays = 0;
  let monthlyHolidayDays = 0;
  let monthlyLeaveDays = 0;
  let monthlyAbsentOnlyDays = 0;
  let yearlyWorkingDays = 0;
  let yearlyEarnedDays = 0;

  for (let currentMonthDay = 1; currentMonthDay <= now.getDate(); currentMonthDay += 1) {
    const date = new Date(year, month, currentMonthDay);
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(currentMonthDay).padStart(2, "0")}`;
    const state = getDayAttendanceState(dateKey, dayMap.get(dateKey), holidaySet, leaveSet, date, now);

    if (state === "holiday") {
      monthlyHolidayDays += 1;
      monthlyExcludedDays += 1;
      continue;
    }
    if (state === "leave") {
      monthlyLeaveDays += 1;
      continue;
    }
    if (state === "neutral") continue;
    monthlyWorkingDays += 1;
    if (state === "present") {
      monthlyPresentDays += 1;
      monthlyEarnedDays += 1;
    }
    if (state === "half") {
      monthlyHalfDays += 1;
      monthlyEarnedDays += 0.5;
    }
    if (state === "absent") {
      monthlyAbsentOnlyDays += 1;
    }
  }

  for (let currentMonth = 0; currentMonth <= month; currentMonth += 1) {
    const lastDay = currentMonth === month ? now.getDate() : new Date(year, currentMonth + 1, 0).getDate();
    for (let currentDay = 1; currentDay <= lastDay; currentDay += 1) {
      const date = new Date(year, currentMonth, currentDay);
      const dateKey = `${year}-${String(currentMonth + 1).padStart(2, "0")}-${String(currentDay).padStart(2, "0")}`;
      const state = getDayAttendanceState(dateKey, dayMap.get(dateKey), holidaySet, leaveSet, date, now);

      if (state === "holiday" || state === "leave" || state === "neutral") continue;
      yearlyWorkingDays += 1;
      if (state === "present") yearlyEarnedDays += 1;
      if (state === "half") yearlyEarnedDays += 0.5;
    }
  }

  const monthlyPercentage = monthlyWorkingDays
    ? Math.round((monthlyEarnedDays / monthlyWorkingDays) * 100)
    : 0;
  const yearlyPercentage = yearlyWorkingDays
    ? Math.round((yearlyEarnedDays / yearlyWorkingDays) * 100)
    : 0;

  return {
    monthlyWorkingDays,
    monthlyEarnedDays,
    monthlyPresentDays,
    monthlyHalfDays,
    monthlyExcludedDays,
    monthlyHolidayDays,
    monthlyLeaveDays,
    monthlyAbsentOnlyDays,
    monthlyAbsentDays: Math.max(monthlyWorkingDays - monthlyEarnedDays, 0),
    monthlyPercentage,
    yearlyWorkingDays,
    yearlyEarnedDays,
    yearlyPercentage,
    overallPercentage: yearlyPercentage
  };
}

export function buildMonthCalendar(
  logs: AttendanceLog[],
  holidays: HolidayRecord[],
  leaveRequests: LeaveRequestRecord[] = [],
  referenceDate = new Date()
) {
  const today = new Date(referenceDate);
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const holidaySet = buildHolidaySet(holidays);
  const leaveSet = buildAcceptedLeaveSet(leaveRequests);
  const dayMap = buildDailyAttendanceMap(logs);
  const firstDayOffset = new Date(year, month, 1).getDay();

  const blanks = Array.from({ length: firstDayOffset }, (_, index) => ({
    date: `blank-${index}`,
    label: "",
    type: "blank" as const
  }));

  const actualDays = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dateObject = new Date(year, month, day);
    const type = getDayAttendanceState(date, dayMap.get(date), holidaySet, leaveSet, dateObject, today);

    return {
      date,
      label: day,
      type
    };
  });

  return [...blanks, ...actualDays];
}

export function buildBotContext(students: StudentRecord[], logs: AttendanceLog[]): BotContext {
  const topStudents = buildTopStudents(students);
  const sorted = [...students].sort((a, b) => b.attendancePercentage - a.attendancePercentage);

  return {
    totalStudents: students.length,
    presentCount: students.filter((student) => student.isPresent).length,
    absentStudents: students.filter((student) => !student.isPresent).map((student) => student.name),
    topStudents,
    highestAttendanceStudent: sorted[0],
    lowestAttendanceStudent: sorted.at(-1),
    students,
    logs
  };
}
