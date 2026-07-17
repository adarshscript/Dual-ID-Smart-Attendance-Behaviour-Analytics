"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getAdminSession } from "@/lib/auth";
import { useDiasData } from "@/hooks/use-dias-data";
import { PageTransition } from "@/components/shared/page-transition";

const COLORS = ["#ffad0f", "#1d2430", "#f4f1ea", "#ff4c4c"];

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateKey(datetime: string) {
  return datetime.slice(0, 10);
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { analytics, students, attendance } = useDiasData();
  const [departmentDate, setDepartmentDate] = useState(() => getLocalDateKey(new Date()));

  useEffect(() => {
    if (!getAdminSession()) {
      router.replace("/admin/login");
    }
  }, [router]);

  const departmentAttendanceData = useMemo(() => {
    const entryRolls = new Set(
      attendance
        .filter((log) => getDateKey(log.datetime) === departmentDate && log.status === "ENTRY")
        .map((log) => String(log.roll || "").trim())
    );

    const departmentMap = new Map<string, { name: string; count: number; present: number }>();

    students.forEach((student) => {
      const current = departmentMap.get(student.department) || {
        name: student.department,
        count: 0,
        present: 0
      };

      current.count += 1;
      if (entryRolls.has(String(student.roll || "").trim())) {
        current.present += 1;
      }

      departmentMap.set(student.department, current);
    });

    return Array.from(departmentMap.values()).map((item) => ({
      ...item,
      attendance: item.count ? Math.round((item.present / item.count) * 100) : 0
    }));
  }, [attendance, departmentDate, students]);

  return (
    <PageTransition>
      <AdminLayout title="Analytics & Reports" subtitle="Deep dive into campus attendance data.">
        <div className="analytics-grid">
          <div className="card-panel chart-panel chart-panel--wide">
            <h3>30-Day Attendance Trend</h3>
            <p>Daily present vs absent counts over the last month</p>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={analytics.dailyTrend}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#ece1ca" />
                  <XAxis dataKey="date" stroke="#5b6578" />
                  <YAxis stroke="#5b6578" />
                  <Tooltip />
                  <Line type="monotone" dataKey="present" stroke="#ffad0f" strokeWidth={3} />
                  <Line type="monotone" dataKey="absent" stroke="#ff4c4c" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-panel chart-panel">
            <div className="panel-header">
              <div>
                <h3>Department Attendance</h3>
                <p>Attendance percentage by department for the selected date</p>
              </div>
              <label
                className="icon-button"
                aria-label="Select department attendance date"
                style={{ position: "relative", overflow: "hidden" }}
              >
                <CalendarDays size={16} />
                <input
                  type="date"
                  value={departmentDate}
                  onChange={(event) => setDepartmentDate(event.target.value)}
                  style={{
                    position: "absolute",
                    width: "42px",
                    height: "42px",
                    top: 0,
                    left: 0,
                    opacity: 0,
                    cursor: "pointer",
                    pointerEvents: "auto"
                  }}
                />
              </label>
            </div>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={departmentAttendanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="4 4" stroke="#ece1ca" />
                  <XAxis type="number" stroke="#5b6578" />
                  <YAxis type="category" dataKey="name" stroke="#5b6578" width={120} />
                  <Tooltip />
                  <Bar dataKey="attendance" fill="#ffad0f" radius={[0, 12, 12, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-panel chart-panel">
            <h3>Enrollment Distribution</h3>
            <p>Total students per department</p>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={analytics.departmentDistribution}
                    dataKey="count"
                    innerRadius={56}
                    outerRadius={86}
                    paddingAngle={4}
                  >
                    {analytics.departmentDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </AdminLayout>
    </PageTransition>
  );
}
