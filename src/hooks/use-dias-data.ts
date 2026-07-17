"use client";

import { useEffect, useState } from "react";
import { isWithinInterval, parseISO } from "date-fns";
import {
  onAttendanceLogs,
  onHolidays,
  onLeaveRequests,
  onNotifications,
  onStudents
} from "@/lib/firebase-queries";
import {
  buildAnalytics,
  buildBotContext,
  buildDashboardMetrics,
  buildTopStudents,
  enhanceAttendanceRows,
  enhanceStudents
} from "@/lib/attendance";
import {
  AttendanceFilters,
  AttendanceLog,
  HolidayRecord,
  LeaveRequestRecord,
  NotificationRecord,
  StudentRecord
} from "@/lib/types";

const defaultFilters: AttendanceFilters = {
  search: "",
  from: "",
  to: "",
  status: "ALL"
};

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useDiasData() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceLog[]>([]);
  const [holidays, setHolidays] = useState<HolidayRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [filters, setFilters] = useState<AttendanceFilters>(defaultFilters);

  useEffect(() => {
    const unsubStudents = onStudents(setStudents);
    const unsubAttendance = onAttendanceLogs(setAttendance);
    const unsubHolidays = onHolidays(setHolidays);
    const unsubLeaveRequests = onLeaveRequests(setLeaveRequests);
    const unsubNotifications = onNotifications(setNotifications);

    return () => {
      unsubStudents();
      unsubAttendance();
      unsubHolidays();
      unsubLeaveRequests();
      unsubNotifications();
    };
  }, []);

  const enhancedStudents = enhanceStudents(students, attendance, holidays);
  const attendanceRows = enhanceAttendanceRows(attendance);
  const allAttendanceRows = attendanceRows;
  const hasActiveFilters =
    Boolean(filters.search.trim()) ||
    Boolean(filters.from) ||
    Boolean(filters.to) ||
    filters.status !== "ALL";
  const todayKey = getLocalDateKey(new Date());

  const filteredAttendance = attendanceRows.filter((row) => {
    const searchValue = filters.search.trim().toLowerCase();
    const matchesSearch =
      !searchValue ||
      row.name.toLowerCase().includes(searchValue) ||
      row.roll.toLowerCase().includes(searchValue);
    const matchesStatus =
      filters.status === "ALL" ||
      filters.status === "ADVANCE" ||
      row.status === filters.status;

    let matchesDate = true;
    if (filters.from && filters.to) {
      const current = new Date(row.datetime);
      matchesDate = isWithinInterval(current, {
        start: parseISO(`${filters.from}T00:00:00`),
        end: parseISO(`${filters.to}T23:59:59`)
      });
    } else if (filters.from) {
      matchesDate = row.datetime.slice(0, 10) >= filters.from;
    } else if (filters.to) {
      matchesDate = row.datetime.slice(0, 10) <= filters.to;
    } else if (!hasActiveFilters) {
      matchesDate = row.datetime.slice(0, 10) === todayKey;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  return {
    students: enhancedStudents,
    attendance,
    holidays,
    leaveRequests,
    notifications,
    metrics: buildDashboardMetrics(enhancedStudents),
    topStudents: buildTopStudents(enhancedStudents),
    attendanceRows: filteredAttendance,
    analytics: buildAnalytics(enhancedStudents, attendanceRows),
    botContext: buildBotContext(enhancedStudents, allAttendanceRows),
    filters,
    setFilters,
    getStudentHistory: (roll: string) =>
      allAttendanceRows
        .filter((item) => item.roll === roll)
        .sort((a, b) => b.datetime.localeCompare(a.datetime))
  };
}
