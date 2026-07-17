import { AttendanceLog, BotContext, StudentRecord } from "@/lib/types";

const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11
};

export const defaultBotMessage =
  "Hello! I am DIAS Assistant. I can help with real-time attendance, student timing, present or absent status, top students, and project-related questions. I was created by Adarsh.";

export function buildChatbotReply(input: string, context: BotContext) {
  const question = normalize(input);
  const student = findStudentInQuestion(question, context.students);
  const dateInfo = parseDateFromQuestion(question);

  if (isGreeting(question)) {
    return "Hello! I am DIAS Assistant. Ask me about any student, any attendance date, present status, timings, or attendance rankings.";
  }

  if (asksForTodayDate(question)) {
    const today = new Date();
    return `Today's date is ${today.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    })}.`;
  }

  if (asksForCurrentTime(question)) {
    return `The current time is ${new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    })}.`;
  }

  if (asksAboutSystem(question)) {
    return "This is the Dual-ID Attendance System. It uses RFID and fingerprint verification and syncs real-time attendance data to Firebase.";
  }

  if (asksAboutCreator(question)) {
    return "I was created by Adarsh's Team for the DIAS project.";
  }

  if (asksCapabilities(question)) {
    return "I can answer student attendance questions, show real-time present and absent status, entry and exit timings, top performers, and date-wise attendance details.";
  }

  if (asksHighestAttendance(question)) {
    const topStudent = context.topStudents[0] || context.highestAttendanceStudent;
    return topStudent
      ? `${topStudent.name} currently leads the monthly attendance ranking with ${topStudent.monthlyAttendancePercentage || 0}% monthly attendance and ${topStudent.yearlyAttendancePercentage || 0}% yearly attendance.`
      : "I could not find enough attendance data yet.";
  }

  if (asksLowestAttendance(question)) {
    return context.lowestAttendanceStudent
      ? `${context.lowestAttendanceStudent.name} currently has the lowest yearly attendance with ${context.lowestAttendanceStudent.yearlyAttendancePercentage || 0}%.`
      : "I could not find enough attendance data yet.";
  }

  if (asksTopThree(question)) {
    return context.topStudents.length
      ? `The current top 3 students by monthly attendance are ${context.topStudents
          .map(
            (item, index) =>
              `${index + 1}. ${item.name} (${item.monthlyAttendancePercentage || 0}% monthly)`
          )
          .join(", ")}.`
      : "Top student data is not available yet.";
  }

  if (asksPresentCount(question)) {
    return `${context.presentCount} students are currently present out of ${context.totalStudents}.`;
  }

  if (asksAbsentList(question)) {
    return context.absentStudents.length
      ? `The students currently absent are: ${context.absentStudents.join(", ")}.`
      : "All students are currently present.";
  }

  if (asksAboutAI(question)) {
    return "AI stands for Artificial Intelligence. It helps systems understand data, detect patterns, and respond in a smart way.";
  }

  if (student) {
    return buildStudentReply(question, student, context.logs, dateInfo);
  }

  if (question.includes("roll number") || question.includes("roll no")) {
    const roll = question.match(/\d+/)?.[0];
    const studentByRoll = context.students.find((item) => item.roll === roll);
    if (studentByRoll) {
      return `${studentByRoll.name} is in roll number ${studentByRoll.roll}, belongs to ${studentByRoll.department}, and is currently ${studentByRoll.isPresent ? "present" : "absent"}.`;
    }
  }

  if (dateInfo && asksDaySummary(question)) {
    return buildDateSummaryReply(dateInfo, context.logs);
  }

  if (question.includes("thank")) {
    return "You are welcome.";
  }

  return "I could not match that question clearly from the current attendance data. Please include a student name, roll number, or a date so I can give an exact answer.";
}

function buildStudentReply(
  question: string,
  student: StudentRecord,
  logs: AttendanceLog[],
  dateInfo?: { key: string; label: string }
) {
  const studentLogs = logs
    .filter((log) => log.roll === student.roll)
    .sort(compareLogs);

  const entryLogs = studentLogs.filter((log) => log.status === "ENTRY");
  const exitLogs = studentLogs.filter((log) => log.status === "EXIT");
  const avgEntry = averageTime(entryLogs);
  const avgExit = averageTime(exitLogs);

  if (dateInfo) {
    const dayLogs = studentLogs.filter((log) => getDateKey(log.datetime) === dateInfo.key);
    const firstEntry = dayLogs.find((log) => log.status === "ENTRY");
    const lastExit = [...dayLogs].sort(compareLogs).reverse().find((log) => log.status === "EXIT");
    const attendanceState = getDayAttendanceState(dayLogs);
    const wantsEntry = asksEntryTime(question);
    const wantsExit = asksExitTime(question);

    if (wantsEntry && wantsExit) {
      return `${student.name} on ${dateInfo.label}: entry at ${formatTime(firstEntry?.datetime) || "not found"}, exit at ${formatTime(lastExit?.datetime) || "not found"}.`;
    }

    if (wantsEntry) {
      return firstEntry
        ? `${student.name} entered on ${dateInfo.label} at ${formatTime(firstEntry.datetime)}.`
        : `No ENTRY record was found for ${student.name} on ${dateInfo.label}.`;
    }

    if (wantsExit) {
      return lastExit
        ? `${student.name} exited on ${dateInfo.label} at ${formatTime(lastExit.datetime)}.`
        : `No EXIT record was found for ${student.name} on ${dateInfo.label}.`;
    }

    if (asksForAttendance(question) || asksForStatus(question) || asksDaySummary(question)) {
      if (!dayLogs.length) {
        return `No attendance record was found for ${student.name} on ${dateInfo.label}.`;
      }

      return `${student.name} on ${dateInfo.label} was marked as ${attendanceState}. ${summarizeDayLogs(dayLogs)}.`;
    }
  }

  if (asksForAttendance(question)) {
    return `${student.name} currently has ${student.monthlyAttendancePercentage || 0}% monthly attendance and ${student.yearlyAttendancePercentage || 0}% yearly attendance. ${student.name} is currently ${student.isPresent ? "present" : "absent"}.`;
  }

  if (asksForStudentQuality(question)) {
    const quality = describeStudentQuality(student.yearlyAttendancePercentage || 0);
    return `${student.name} appears to be ${quality}. Current monthly attendance is ${student.monthlyAttendancePercentage || 0}% and yearly attendance is ${student.yearlyAttendancePercentage || 0}%. Average entry time is ${avgEntry || "not available"} and average exit time is ${avgExit || "not available"}.`;
  }

  if (asksForStatus(question)) {
    return `${student.name} is currently ${student.isPresent ? "present" : "absent"}.`;
  }

  if (asksEntryTime(question)) {
    return avgEntry
      ? `${student.name} usually enters around ${avgEntry}.`
      : `I could not find enough ENTRY records for ${student.name}.`;
  }

  if (asksExitTime(question)) {
    return avgExit
      ? `${student.name} usually exits around ${avgExit}.`
      : `I could not find enough EXIT records for ${student.name}.`;
  }

  return `${student.name} belongs to the ${student.department} department, has ${student.monthlyAttendancePercentage || 0}% monthly attendance and ${student.yearlyAttendancePercentage || 0}% yearly attendance, and is currently ${student.isPresent ? "present" : "absent"}.`;
}

function buildDateSummaryReply(
  dateInfo: { key: string; label: string },
  logs: AttendanceLog[]
) {
  const dayLogs = logs.filter((log) => getDateKey(log.datetime) === dateInfo.key);
  const latestStatusByRoll = new Map<string, AttendanceLog>();

  dayLogs
    .slice()
    .sort(compareLogs)
    .forEach((log) => {
      latestStatusByRoll.set(log.roll, log);
    });

  const presentStudents = Array.from(latestStatusByRoll.values())
    .filter((log) => log.status === "ENTRY")
    .map((log) => log.name);

  const exitedStudents = Array.from(latestStatusByRoll.values())
    .filter((log) => log.status === "EXIT")
    .map((log) => log.name);

  if (!dayLogs.length) {
    return `No attendance records were found for ${dateInfo.label}.`;
  }

  return `${dateInfo.label}: ${presentStudents.length} students ended the day as present and ${exitedStudents.length} ended the day as exited. ${presentStudents.length ? `Present: ${presentStudents.join(", ")}. ` : ""}${exitedStudents.length ? `Exited: ${exitedStudents.join(", ")}.` : ""}`.trim();
}

function compareLogs(a: AttendanceLog, b: AttendanceLog) {
  const timeDiff = parseDateTime(a.datetime).getTime() - parseDateTime(b.datetime).getTime();
  if (timeDiff !== 0) return timeDiff;

  const aId = Number(String(a.id || "").replace(/\D/g, ""));
  const bId = Number(String(b.id || "").replace(/\D/g, ""));
  if (!Number.isNaN(aId) && !Number.isNaN(bId) && aId !== bId) {
    return aId - bId;
  }

  if (a.status === b.status) return 0;
  return a.status === "ENTRY" ? -1 : 1;
}

function parseDateTime(datetime?: string) {
  if (!datetime) return new Date(0);
  const normalized = datetime.includes("T") ? datetime : datetime.replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function isGreeting(question: string) {
  return (
    question === "hi" ||
    question === "hello" ||
    question === "hey" ||
    question.includes("good morning") ||
    question.includes("good evening")
  );
}

function asksForTodayDate(question: string) {
  return (
    question.includes("aaj kon sa date") ||
    question.includes("aaj konsa date") ||
    question.includes("aaj ki date") ||
    question.includes("today date") ||
    question.includes("what is today's date") ||
    question.includes("what is todays date")
  );
}

function asksForCurrentTime(question: string) {
  return (
    question.includes("time kya hua") ||
    question.includes("abhi time kya hai") ||
    question.includes("what time") ||
    question.includes("current time")
  );
}

function asksAboutSystem(question: string) {
  return (
    question.includes("who are you") ||
    question.includes("what is this system") ||
    question.includes("what is dias") ||
    question.includes("what is this attendance system")
  );
}

function asksAboutCreator(question: string) {
  return (
    question.includes("who created you") ||
    question.includes("who made you") ||
    question.includes("who created dias") ||
    question.includes("who built you")
  );
}

function asksCapabilities(question: string) {
  return (
    question.includes("what can you do") ||
    question.includes("help me") ||
    question === "help"
  );
}

function asksHighestAttendance(question: string) {
  return (
    question.includes("highest attendance") ||
    question.includes("best performing") ||
    question.includes("top student")
  );
}

function asksLowestAttendance(question: string) {
  return (
    question.includes("lowest attendance") ||
    question.includes("worst attendance") ||
    question.includes("least attendance")
  );
}

function asksTopThree(question: string) {
  return question.includes("top 3") || question.includes("top three");
}

function asksPresentCount(question: string) {
  return (
    question.includes("how many present") ||
    question.includes("present today") ||
    question.includes("present right now") ||
    question.includes("currently present")
  );
}

function asksAbsentList(question: string) {
  return (
    question.includes("who is absent") ||
    question.includes("who are absent") ||
    question.includes("absent today") ||
    question.includes("currently absent")
  );
}

function asksAboutAI(question: string) {
  return question.includes("what is ai");
}

function asksForAttendance(question: string) {
  return (
    question.includes("attendance") ||
    question.includes("attendance of") ||
    question.includes("attendance percentage") ||
    question.includes("kitna percentage")
  );
}

function asksForStatus(question: string) {
  return (
    question.includes("present") ||
    question.includes("absent") ||
    question.includes("currently") ||
    question.includes("status")
  );
}

function asksForStudentQuality(question: string) {
  return (
    question.includes("kaisa student") ||
    question.includes("how is") ||
    question.includes("describe") ||
    question.includes("kesa student")
  );
}

function asksEntryTime(question: string) {
  return (
    question.includes("kitne baje aaya") ||
    question.includes("kab aaya") ||
    question.includes("when came") ||
    question.includes("arrival") ||
    question.includes("entry time")
  );
}

function asksExitTime(question: string) {
  return (
    question.includes("kab gaya") ||
    question.includes("kitne baje gaya") ||
    question.includes("when left") ||
    question.includes("departure") ||
    question.includes("exit time")
  );
}

function asksDaySummary(question: string) {
  return (
    question.includes("on ") ||
    question.includes("today") ||
    question.includes("yesterday") ||
    question.includes("history") ||
    question.includes("details")
  );
}

function findStudentInQuestion(question: string, students: StudentRecord[]) {
  const sorted = [...students].sort((a, b) => b.name.length - a.name.length);
  return sorted.find((student) => {
    const full = student.name.toLowerCase();
    const first = full.split(" ")[0];
    return question.includes(full) || question.includes(first) || question.includes(student.roll.toLowerCase());
  });
}

function parseDateFromQuestion(question: string) {
  if (question.includes("today") || question.includes("aaj")) {
    return createDateInfo(new Date());
  }

  if (question.includes("yesterday") || question.includes("kal")) {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    return createDateInfo(now);
  }

  const isoMatch = question.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    return createDateInfo(new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00`));
  }

  const dayMonthMatch = question.match(
    /\b(\d{1,2})\s+(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)(?:\s+(\d{4}))?\b/
  );

  if (dayMonthMatch) {
    const day = Number(dayMonthMatch[1]);
    const month = MONTHS[dayMonthMatch[2]];
    const year = Number(dayMonthMatch[3] || new Date().getFullYear());
    return createDateInfo(new Date(year, month, day));
  }

  const monthDayMatch = question.match(
    /\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+(\d{1,2})(?:\s*,?\s*(\d{4}))?\b/
  );

  if (monthDayMatch) {
    const month = MONTHS[monthDayMatch[1]];
    const day = Number(monthDayMatch[2]);
    const year = Number(monthDayMatch[3] || new Date().getFullYear());
    return createDateInfo(new Date(year, month, day));
  }

  return undefined;
}

function createDateInfo(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return {
    key: `${year}-${month}-${day}`,
    label: date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    })
  };
}

function getDateKey(datetime: string) {
  return datetime.slice(0, 10);
}

function averageTime(logs: AttendanceLog[]) {
  if (!logs.length) return "";

  const totalMinutes = logs.reduce((sum, log) => {
    const date = parseDateTime(log.datetime);
    return sum + date.getHours() * 60 + date.getMinutes();
  }, 0);

  const averageMinutes = Math.round(totalMinutes / logs.length);
  const hours = Math.floor(averageMinutes / 60);
  const minutes = averageMinutes % 60;

  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatTime(datetime?: string) {
  if (!datetime) return "";
  return parseDateTime(datetime).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function describeStudentQuality(percentage: number) {
  if (percentage >= 80) return "excellent and disciplined";
  if (percentage >= 60) return "good and fairly regular";
  if (percentage >= 40) return "average but inconsistent";
  return "irregular and in need of attendance improvement";
}

function getDayAttendanceState(dayLogs: AttendanceLog[]) {
  const hasEntry = dayLogs.some((log) => log.status === "ENTRY");
  const hasExit = dayLogs.some((log) => log.status === "EXIT");

  if (hasEntry && hasExit) return "full attendance";
  if (hasEntry) return "half attendance";
  if (hasExit) return "exit-only record";
  return "no attendance";
}

function summarizeDayLogs(logs: AttendanceLog[]) {
  const sortedLogs = [...logs].sort(compareLogs);
  const entries = sortedLogs.filter((log) => log.status === "ENTRY");
  const exits = sortedLogs.filter((log) => log.status === "EXIT");
  const firstEntry = entries[0];
  const lastExit = exits.at(-1);

  return `ENTRY records: ${entries.length}, EXIT records: ${exits.length}, first entry ${formatTime(firstEntry?.datetime) || "not found"}, last exit ${formatTime(lastExit?.datetime) || "not found"}`;
}
