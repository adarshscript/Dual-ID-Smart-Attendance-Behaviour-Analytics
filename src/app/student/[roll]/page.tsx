"use client";

import { Building2, CalendarDays, LogOut, Mail, Phone, UserRound } from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageTransition } from "@/components/shared/page-transition";
import { ActivityCalendar } from "@/components/student/activity-calendar";
import { useDiasData } from "@/hooks/use-dias-data";
import { getStudentSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { calculateAttendanceStats } from "@/lib/attendance";
import { NavLink } from "@/components/shared/nav-link";
import { submitLeaveRequest } from "@/lib/firebase-queries";
import { showToast } from "@/lib/feedback";

const ATTENDANCE_DISTRIBUTION_COLORS: Record<string, string> = {
  Present: "#12c95a",
  "Half Attendance": "#ffad0f",
  Absent: "#ff4c4c",
  Excluded: "#3e8cff",
  "Approved Leave": "#5f6675"
};
const CURRENT_MONTH_KEY = getCurrentMonthKey();

export default function StudentProfilePage() {
  const params = useParams<{ roll: string }>();
  const router = useRouter();
  const { students, holidays, leaveRequests, getStudentHistory, notifications } = useDiasData();
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveDate, setLeaveDate] = useState("");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH_KEY);
  const [notificationMonth, setNotificationMonth] = useState(getCurrentMonthKey);
  const student = students.find((entry) => entry.roll === params.roll);
  const logs = getStudentHistory(params.roll);
  const todayKey = getLocalDateKey(new Date());

  useEffect(() => {
    const sessionRoll = getStudentSession();
    if (!sessionRoll || sessionRoll !== params.roll) {
      router.replace("/classroom");
    }
  }, [params.roll, router]);

  if (!student) {
    return null;
  }

  const studentLeaveRequests = leaveRequests.filter(
    (request) => request.roll === student.roll
  );
  const acceptedStudentLeaveRequests = studentLeaveRequests.filter(
    (request) => request.status === "ACCEPTED"
  );
  const stats = calculateAttendanceStats(logs, holidays, acceptedStudentLeaveRequests);
  const selectedMonthStats = calculateAttendanceStats(
    logs,
    holidays,
    acceptedStudentLeaveRequests,
    getReferenceDateForMonth(selectedMonth)
  );
  const selectedMonthLabel = getMonthLabel(selectedMonth);
  const averageEntryTime = buildAverageTime(
    logs.filter((log) => log.status === "ENTRY").map((log) => log.datetime)
  );
  const averageExitTime = buildAverageTime(
    logs.filter((log) => log.status === "EXIT").map((log) => log.datetime)
  );

  const attendanceChart = [
    { name: "Present", value: selectedMonthStats.monthlyPresentDays },
    { name: "Half Attendance", value: selectedMonthStats.monthlyHalfDays },
    { name: "Absent", value: selectedMonthStats.monthlyAbsentOnlyDays },
    { name: "Excluded", value: selectedMonthStats.monthlyHolidayDays },
    { name: "Approved Leave", value: selectedMonthStats.monthlyLeaveDays }
  ];
  const visibleAttendanceChart = attendanceChart.filter((entry) => entry.value > 0);
  const studentNotifications = notifications.filter(
    (note) => !note.targetRoll || note.targetRoll === student.roll
  );
  const filteredStudentNotifications = studentNotifications.filter(
    (note) => getMonthKeyFromValue(note.createdAt) === notificationMonth
  );

  async function handleLeaveSubmit() {
    if (!student) return;

    if (!leaveReason.trim() || !leaveDate) {
      showToast({
        title: "Missing details",
        message: "Please enter a leave reason and date.",
        tone: "error"
      });
      return;
    }

    if (leaveDate < todayKey) {
      showToast({
        title: "Invalid date",
        message: "Leave requests can only be submitted for today or future dates.",
        tone: "error"
      });
      return;
    }

    setShowLeaveConfirm(true);
  }

  async function submitConfirmedLeaveRequest() {
    if (!student || isSubmittingLeave) return;
    try {
      setIsSubmittingLeave(true);
      await submitLeaveRequest({
        studentName: student.name,
        roll: student.roll,
        department: student.department,
        reason: leaveReason.trim(),
        date: leaveDate
      });
      setLeaveReason("");
      setLeaveDate("");
      setShowLeaveConfirm(false);
      showToast({
        title: "Leave request submitted",
        message: "Your request has been sent to the admin for review.",
        tone: "success"
      });
    } catch {
      showToast({
        title: "Submission failed",
        message: "Your leave request could not be submitted. Please try again.",
        tone: "error"
      });
    } finally {
      setIsSubmittingLeave(false);
    }
  }

  return (
    <PageTransition>
      <main className="student-shell">
        <header className="classroom-header">
          <div className="classroom-brand">
            <div className="brand-mark">
              <UserRound size={20} />
            </div>
            <div>
              <strong>DIAS</strong>
            </div>
          </div>

          <NavLink href="/" className="back-link back-link--classroom" label="Returning to home...">
            <LogOut size={18} />
            Exit
          </NavLink>
        </header>

        <NavLink
          href="/classroom"
          className="back-link back-link--spaced back-link--classroom"
          label="Going back to classroom..."
        >
          Back to Classroom
        </NavLink>

        <section className="student-profile-layout">
          <div className="student-summary-card">
            <div className="student-summary-card__head" />
            <div className="student-profile-badge">{student.name.charAt(0)}</div>
            <h1>{student.name}</h1>
            <span className="dept-pill">{student.roll}</span>

            <div className="profile-facts">
              <div>
                <Building2 size={18} />
                <span>{student.department}</span>
              </div>
              <div>
                <Mail size={18} />
                <span>{student.email || "No Email"}</span>
              </div>
              <div>
                <Phone size={18} />
                <span>{student.phone || "No Phone"}</span>
              </div>
              <div>
                <CalendarDays size={18} />
                <span>Enrolled {student.enrolledAtLabel}</span>
              </div>
            </div>

            <div className="rate-block">
              <div className="rate-block__title">
                <span>Monthly Attendance ({selectedMonthLabel})</span>
                <strong>{selectedMonthStats.monthlyPercentage}%</strong>
              </div>
              <div className="progress-bar">
                <span style={{ width: `${selectedMonthStats.monthlyPercentage}%` }} />
              </div>
            </div>

            <div className="profile-stat-list">
              <div className="profile-stat-item">
                <span>Overall Attendance</span>
                <strong>{stats.overallPercentage}%</strong>
              </div>
              <div className="profile-stat-item">
                <span>Yearly Attendance</span>
                <strong>{stats.yearlyPercentage}%</strong>
              </div>
              <div className="profile-stat-item">
                <span>Average Entry Time</span>
                <strong>{averageEntryTime || "--"}</strong>
              </div>
              <div className="profile-stat-item">
                <span>Average Exit Time</span>
                <strong>{averageExitTime || "--"}</strong>
              </div>
            </div>

            <div className="badge-row">
              <span className="tag tag-success">RFID</span>
              <span className="tag tag-info">Bio</span>
            </div>
          </div>

          <div className="student-metrics-area">
            <div className="student-top-grid">
              <div className="card-panel">
                <div className="panel-header panel-header--compact">
                  <div>
                    <h3>Attendance Distribution</h3>
                    <p className="muted-text">
                      {selectedMonthLabel} overview. Full day = 1, half day = 0.5.
                    </p>
                  </div>
                </div>
                <div className="chart-box chart-box--with-center">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={visibleAttendanceChart}
                        dataKey="value"
                        innerRadius={62}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {visibleAttendanceChart.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={ATTENDANCE_DISTRIBUTION_COLORS[entry.name]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="chart-center-label">
                    <strong>{selectedMonthStats.monthlyPercentage}%</strong>
                    <span>{selectedMonthLabel}</span>
                  </div>
                </div>
                <div className="attendance-legend">
                  {attendanceChart.map((entry, index) => (
                    <div key={entry.name} className="attendance-legend__item">
                      <span
                        className="attendance-legend__dot"
                        style={{ backgroundColor: ATTENDANCE_DISTRIBUTION_COLORS[entry.name] }}
                      />
                      <span>{entry.name}</span>
                      <strong>{entry.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-panel">
                <div className="panel-header panel-header--compact">
                  <div>
                    <h3>Activity Calendar</h3>
                    <p className="muted-text">Select a month to review attendance activity.</p>
                  </div>
                  <input
                    type="month"
                    className="month-filter-input"
                    value={selectedMonth}
                    max={CURRENT_MONTH_KEY}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                  />
                </div>
                <ActivityCalendar
                  logs={logs}
                  holidays={holidays}
                  leaveRequests={acceptedStudentLeaveRequests}
                  month={selectedMonth}
                />
              </div>
            </div>

            <div className="card-panel">
              <h3>Recent Access Logs</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Event Type</th>
                    <th>Duration Logged</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 8).map((log) => (
                    <tr key={log.id}>
                      <td>{formatDateTime(log.datetime)}</td>
                      <td>
                        <span className={`status-pill status-pill--${log.status.toLowerCase()}`}>
                          {log.status}
                        </span>
                      </td>
                      <td>{log.durationLabel || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="student-top-grid">
              <div className="card-panel">
                <div className="panel-header panel-header--compact">
                  <div>
                    <h3>Notifications</h3>
                    <p>Monthly alerts and leave updates.</p>
                  </div>
                  <input
                    type="month"
                    className="month-filter-input"
                    value={notificationMonth}
                    onChange={(event) => setNotificationMonth(event.target.value)}
                  />
                </div>
                <div className="stacked-notes">
                  {filteredStudentNotifications.length ? (
                    filteredStudentNotifications.slice(0, 6).map((note) => (
                      <div key={note.id} className="note-card">
                        <strong>{note.title}</strong>
                        <p>{note.message}</p>
                        <p>{formatDateTime(note.createdAt)}</p>
                      </div>
                    ))
                  ) : (
                    <div className="note-card">
                      <strong>No notifications found</strong>
                      <p>No notifications are available for the selected month.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="card-panel">
                <h3>Leave Request</h3>
                <p className="muted-text">Submit a leave request for today or an upcoming date.</p>
                <div className="stack-form">
                  <input
                    placeholder="Reason for leave"
                    value={leaveReason}
                    onChange={(event) => setLeaveReason(event.target.value)}
                  />
                  <input
                    type="date"
                    min={todayKey}
                    value={leaveDate}
                    onChange={(event) => setLeaveDate(event.target.value)}
                  />
                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleLeaveSubmit}
                    disabled={isSubmittingLeave}
                  >
                    {isSubmittingLeave ? "Submitting..." : "Submit Leave Request"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {showLeaveConfirm ? (
          <div className="modal-backdrop">
            <div className="modal-card">
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowLeaveConfirm(false)}
              >
                x
              </button>
              <h3>Confirm Leave Request</h3>
              <p>Submit this leave request to the admin?</p>
              <div className="note-card leave-confirm-summary">
                <strong>{student.name}</strong>
                <p>Date: {leaveDate}</p>
                <p>Reason: {leaveReason}</p>
              </div>
              <div className="modal-actions leave-confirm-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowLeaveConfirm(false)}
                  disabled={isSubmittingLeave}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={submitConfirmedLeaveRequest}
                  disabled={isSubmittingLeave}
                >
                  {isSubmittingLeave ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </PageTransition>
  );
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentMonthKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getMonthLabel(month: string) {
  return getReferenceDateForMonth(month).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric"
  });
}

function getReferenceDateForMonth(month: string) {
  if (!month) return new Date();

  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const today = new Date();

  if (year === today.getFullYear() && monthIndex === today.getMonth()) {
    return today;
  }

  return new Date(year, monthIndex + 1, 0);
}

function getMonthKeyFromValue(value: string) {
  if (!value) return "";
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 7);
  }
  return getMonthKeyFromDate(date);
}

function getMonthKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function buildAverageTime(values: string[]) {
  if (!values.length) return "";

  const totalMinutes = values.reduce((sum, value) => {
    const date = new Date(value.replace(" ", "T"));
    return sum + date.getHours() * 60 + date.getMinutes();
  }, 0);

  const averageMinutes = Math.round(totalMinutes / values.length);
  const hours = Math.floor(averageMinutes / 60);
  const minutes = averageMinutes % 60;

  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}
