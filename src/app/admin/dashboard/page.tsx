"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  CalendarDays,
  Download,
  Medal,
  UsersRound
} from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { StatCard } from "@/components/shared/stat-card";
import { AttendanceTable } from "@/components/admin/attendance-table";
import { TopStudentsPodium } from "@/components/admin/top-students-podium";
import { LiveStatusPanel } from "@/components/admin/live-status-panel";
import { HolidayManager } from "@/components/admin/holiday-manager";
import { getAdminSession } from "@/lib/auth";
import { useDiasData } from "@/hooks/use-dias-data";
import { downloadAdvancedAttendanceCsv, downloadAttendanceCsv } from "@/lib/export";
import { PageTransition } from "@/components/shared/page-transition";
import { formatDateTime } from "@/lib/format";
import { showRouteLoading, showToast } from "@/lib/feedback";
import {
  markLeaveRequestsViewed,
  updateLeaveRequestStatus
} from "@/lib/firebase-queries";
import { LeaveRequestRecord, LeaveRequestStatus } from "@/lib/types";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { metrics, topStudents, attendanceRows, students, attendance, holidays, leaveRequests, notifications, filters, setFilters } =
    useDiasData();
  const [showLeaveRequests, setShowLeaveRequests] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [adminNotificationMonth, setAdminNotificationMonth] = useState(getCurrentMonthKey);
  const [leaveRequestYear, setLeaveRequestYear] = useState(getCurrentYearKey);
  const [selectedLeaveRequest, setSelectedLeaveRequest] =
    useState<LeaveRequestRecord | null>(null);
  const [pendingLeaveAction, setPendingLeaveAction] = useState<{
    request: LeaveRequestRecord;
    status: LeaveRequestStatus;
  } | null>(null);
  const [isResolvingLeave, setIsResolvingLeave] = useState(false);
  const unreadLeaveCount = leaveRequests.filter(
    (request) => request.status === "PENDING" && !request.adminViewed
  ).length;
  const sortedLeaveRequests = [...leaveRequests].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  const leaveRequestYears = Array.from(
    new Set([getCurrentYearKey(), ...leaveRequests.map((request) => request.date.slice(0, 4))])
  ).sort((a, b) => b.localeCompare(a));
  const filteredLeaveRequests = sortedLeaveRequests.filter(
    (request) => request.date.startsWith(leaveRequestYear)
  );
  const filteredAdminNotifications = notifications
    .filter((note) => getMonthKeyFromValue(note.createdAt) === adminNotificationMonth)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  useEffect(() => {
    if (!getAdminSession()) {
      router.replace("/admin/login");
    }
  }, [router]);

  async function openLeaveRequests() {
    setShowLeaveRequests(true);
    const unreadIds = leaveRequests
      .filter((request) => request.status === "PENDING" && !request.adminViewed)
      .map((request) => request.id);

    if (unreadIds.length) {
      await markLeaveRequestsViewed(unreadIds);
    }
  }

  async function resolveLeaveRequest(
    request: LeaveRequestRecord,
    status: LeaveRequestStatus
  ) {
    try {
      setIsResolvingLeave(true);
      await updateLeaveRequestStatus(request, status);
      showToast({
        title:
          status === "ACCEPTED"
            ? "Leave request accepted"
            : status === "REJECTED"
              ? "Leave request rejected"
              : "Approved leave cancelled",
        message: "The student has been notified.",
        tone: "success"
      });
      setSelectedLeaveRequest(null);
      setPendingLeaveAction(null);
    } catch {
      showToast({
        title: "Update failed",
        message: "The leave request could not be updated. Please try again.",
        tone: "error"
      });
    } finally {
      setIsResolvingLeave(false);
    }
  }

  return (
    <PageTransition>
      <AdminLayout
        title="Command Center"
        subtitle="Live campus attendance operations and insights."
      >
        <section className="dashboard-grid">
          <StatCard title="Total Students" value={metrics.totalStudents} icon={UsersRound} />
          <StatCard title="Present Students" value={metrics.presentStudents} icon={Activity} />
          <StatCard title="Absent Students" value={metrics.absentStudents} icon={Bell} />
          <StatCard title="Attendance %" value={`${metrics.attendanceRate}%`} icon={Medal} />
        </section>

        <section className="dashboard-panels">
          <TopStudentsPodium students={topStudents} />
          <LiveStatusPanel students={students} />
        </section>

        <section className="card-panel">
          <div className="panel-header">
            <div>
              <h3>Attendance Log</h3>
              <p>Track every entry, exit, and attendance duration in real time.</p>
            </div>
            <div className="panel-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  if (filters.status === "ADVANCE") {
                    downloadAdvancedAttendanceCsv({
                      students,
                      logs: attendance,
                      holidays,
                      leaveRequests,
                      filters
                    });
                  } else {
                    downloadAttendanceCsv(attendanceRows);
                  }
                  showToast({
                    title: filters.status === "ADVANCE" ? "Advanced CSV exported" : "CSV exported",
                    message:
                      filters.status === "ADVANCE"
                        ? "Student-wise attendance summary export has started."
                        : "Filtered attendance export has started.",
                    tone: "success"
                  });
                }}
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </div>

          <div className="filter-row">
            <input
              placeholder="Search by name or roll..."
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
            />
            <input
              type="date"
              value={filters.from}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, from: event.target.value }))
              }
            />
            <input
              type="date"
              value={filters.to}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, to: event.target.value }))
              }
            />
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, status: event.target.value as "ALL" | "ENTRY" | "EXIT" | "ADVANCE" }))
              }
            >
              <option value="ALL">All Status</option>
              <option value="ENTRY">ENTRY</option>
              <option value="EXIT">EXIT</option>
              <option value="ADVANCE">ADVANCE</option>
            </select>
          </div>

          <AttendanceTable rows={attendanceRows} />
        </section>

        <section className="dashboard-panels">
          <HolidayManager holidays={holidays} />

          <div className="card-panel soft-dark">
            <div className="panel-header">
              <div>
                <h3>Quick Access</h3>
                <p>Admin shortcuts for advanced system operations.</p>
              </div>
              <CalendarDays size={18} />
            </div>
            <div className="shortcut-list">
              <button
                type="button"
                className="shortcut-item shortcut-item--button"
                onClick={() => {
                  const section = document.querySelector(".data-table");
                  section?.scrollIntoView({ behavior: "smooth", block: "start" });
                  showToast({
                    title: "Attendance history",
                    message: "Jumped to the attendance log section.",
                    tone: "info"
                  });
                }}
              >
                View Full Attendance History
              </button>
              <button
                type="button"
                className="shortcut-item shortcut-item--button"
                onClick={() => {
                  showRouteLoading("Opening analytics...");
                  router.push("/admin/analytics");
                }}
              >
                Attendance Analysis
              </button>
              <button
                type="button"
                className="shortcut-item shortcut-item--button"
                onClick={openLeaveRequests}
              >
                Leave Requests
                {unreadLeaveCount ? (
                  <span className="unread-badge">{unreadLeaveCount}</span>
                ) : null}
              </button>
              <button
                type="button"
                className="shortcut-item shortcut-item--button"
                onClick={() => setShowNotifications(true)}
              >
                Notifications System
              </button>
            </div>
          </div>
        </section>

        {showLeaveRequests ? (
          <div className="modal-backdrop">
            <div className="modal-card modal-card--wide modal-card--scrollable">
              <button
                type="button"
                className="modal-close"
                onClick={() => {
                  setShowLeaveRequests(false);
                  setSelectedLeaveRequest(null);
                  setPendingLeaveAction(null);
                }}
              >
                ×
              </button>
              <div className="panel-header panel-header--compact">
                <div>
                  <h3>Leave Requests</h3>
                  <p>Filter requests by leave year.</p>
                </div>
                <select
                  className="month-filter-input"
                  value={leaveRequestYear}
                  onChange={(event) => setLeaveRequestYear(event.target.value)}
                >
                  {leaveRequestYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedLeaveRequest ? (
                <div className="stacked-notes" style={{ marginTop: "1rem" }}>
                  {filteredLeaveRequests.length ? (
                    filteredLeaveRequests.map((request) => (
                      <button
                        type="button"
                        key={request.id}
                        className={`shortcut-item shortcut-item--button leave-request-card leave-request-card--${request.status.toLowerCase()}`}
                        onClick={() => setSelectedLeaveRequest(request)}
                      >
                        <strong>
                          {request.studentName} - Roll {request.roll}
                        </strong>
                        <p>
                          {request.date} | {request.status}
                        </p>
                        <p>Requested: {formatDateTime(request.createdAt)}</p>
                      </button>
                    ))
                  ) : (
                    <div className="shortcut-item">
                      <p>No leave requests found for the selected year.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="stacked-notes" style={{ marginTop: "1rem" }}>
                  <div className="note-card">
                    <strong>
                      {selectedLeaveRequest.studentName} - Roll {selectedLeaveRequest.roll}
                    </strong>
                    <p>Department: {selectedLeaveRequest.department}</p>
                    <p>Date: {selectedLeaveRequest.date}</p>
                    <p>Requested: {formatDateTime(selectedLeaveRequest.createdAt)}</p>
                    <p>Status: {selectedLeaveRequest.status}</p>
                    <p>Reason: {selectedLeaveRequest.reason}</p>
                  </div>
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setSelectedLeaveRequest(null)}
                    >
                      Back
                    </button>
                    {selectedLeaveRequest.status === "PENDING" ? (
                      <>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            setPendingLeaveAction({
                              request: selectedLeaveRequest,
                              status: "REJECTED"
                            })
                          }
                          disabled={isResolvingLeave}
                        >
                          Reject Request
                        </button>
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() =>
                            setPendingLeaveAction({
                              request: selectedLeaveRequest,
                              status: "ACCEPTED"
                            })
                          }
                          disabled={isResolvingLeave}
                        >
                          Accept Request
                        </button>
                      </>
                    ) : selectedLeaveRequest.status === "ACCEPTED" ? (
                      <button
                        type="button"
                        className="secondary-button secondary-button--danger"
                        onClick={() =>
                          setPendingLeaveAction({
                            request: selectedLeaveRequest,
                            status: "CANCELLED"
                          })
                        }
                        disabled={isResolvingLeave}
                      >
                        Cancel Leave
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {showNotifications ? (
          <div className="modal-backdrop">
            <div className="modal-card modal-card--wide">
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowNotifications(false)}
              >
                x
              </button>
              <div className="panel-header panel-header--compact">
                <div>
                  <h3>Notifications System</h3>
                  <p>Monthly system notifications and leave updates.</p>
                </div>
                <input
                  type="month"
                  className="month-filter-input"
                  value={adminNotificationMonth}
                  onChange={(event) => setAdminNotificationMonth(event.target.value)}
                />
              </div>

              <div className="stacked-notes" style={{ marginTop: "1rem" }}>
                {filteredAdminNotifications.length ? (
                  filteredAdminNotifications.map((note) => (
                    <div key={note.id} className="note-card">
                      <strong>{note.title}</strong>
                      <p>{note.message}</p>
                      {note.targetRoll ? <p>Student Roll: {note.targetRoll}</p> : null}
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
          </div>
        ) : null}

        {pendingLeaveAction ? (
          <div className="modal-backdrop">
            <div className="modal-card">
              <button
                type="button"
                className="modal-close"
                onClick={() => setPendingLeaveAction(null)}
              >
                x
              </button>
              <h3>Confirm Action</h3>
              <p>
                {pendingLeaveAction.status === "ACCEPTED"
                  ? "Accept this leave request?"
                  : pendingLeaveAction.status === "REJECTED"
                    ? "Reject this leave request?"
                    : "Cancel this approved leave?"}
              </p>
              <div className="note-card">
                <strong>{pendingLeaveAction.request.studentName}</strong>
                <p>Roll: {pendingLeaveAction.request.roll}</p>
                <p>Date: {pendingLeaveAction.request.date}</p>
                <p>Reason: {pendingLeaveAction.request.reason}</p>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setPendingLeaveAction(null)}
                  disabled={isResolvingLeave}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() =>
                    resolveLeaveRequest(
                      pendingLeaveAction.request,
                      pendingLeaveAction.status
                    )
                  }
                  disabled={isResolvingLeave}
                >
                  {isResolvingLeave
                    ? "Updating..."
                    : pendingLeaveAction.status === "CANCELLED"
                      ? "Cancel Leave"
                      : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </AdminLayout>
    </PageTransition>
  );
}

function getCurrentMonthKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getCurrentYearKey() {
  return String(new Date().getFullYear());
}

function getMonthKeyFromValue(value: string) {
  if (!value) return "";
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 7);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
