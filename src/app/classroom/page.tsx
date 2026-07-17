"use client";

import { LogOut, School, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageTransition } from "@/components/shared/page-transition";
import { useDiasData } from "@/hooks/use-dias-data";
import { StudentLoginModal } from "@/components/student/student-login-modal";
import { NavLink } from "@/components/shared/nav-link";

export default function ClassroomPage() {
  const { students, metrics, topStudents } = useDiasData();
  const [query, setQuery] = useState("");
  const [selectedRoll, setSelectedRoll] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredStudents = useMemo(() => {
    const value = query.toLowerCase();
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(value) ||
        student.roll.toLowerCase().includes(value)
    );
  }, [query, students]);

  if (!mounted) {
    return null;
  }

  return (
    <PageTransition>
      <main className="classroom-shell">
        <header className="classroom-header">
          <div className="classroom-brand">
            <div className="brand-mark">
              <School size={20} />
            </div>
            <div className="classroom-brand-copy">
              <strong>DIAS</strong>
              <span>CLASSROOM</span>
            </div>
          </div>

          <NavLink href="/" className="back-link back-link--classroom" label="Returning to home...">
            <LogOut size={18} />
            Exit
          </NavLink>
        </header>

        <section className="classroom-top">
          <div>
            <h1>Classroom View</h1>
            <p>Live overview of student presence on campus.</p>
          </div>

          <div className="summary-strip summary-strip--horizontal">
            <div className="summary-strip__item">
              <strong>{metrics.totalStudents}</strong>
              <span>Total</span>
            </div>
            <div className="summary-strip__item">
              <strong className="text-success">{metrics.presentStudents}</strong>
              <span>Present</span>
            </div>
            <div className="summary-strip__item">
              <strong className="text-danger">{metrics.absentStudents}</strong>
              <span>Absent</span>
            </div>
          </div>
        </section>

        <div className="search-input search-input--wide">
          <Search size={18} />
          <input
            placeholder="Find student by name or roll no..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <section className="podium-inline">
          {topStudents.map((student, index) => (
            <div key={student.id} className={`mini-podium mini-podium--${index + 1}`}>
              <span>#{index + 1}</span>
              <strong>{student.name}</strong>
              <p>{student.monthlyAttendancePercentage || 0}% monthly attendance</p>
            </div>
          ))}
        </section>

        <section className="classroom-grid">
          {filteredStudents.map((student) => (
            <button
              type="button"
              key={student.id}
              className={`student-seat ${student.isPresent ? "student-seat--present" : "student-seat--absent"}`}
              onClick={() => setSelectedRoll(student.roll)}
            >
              <div className="seat-avatar">
                {student.name.charAt(0)}
                <span className={student.isPresent ? "online-indicator" : "offline-indicator"} />
              </div>
              <h3>{student.name}</h3>
              <p>{student.roll}</p>
              <span className="dept-pill">{student.department}</span>
            </button>
          ))}
        </section>

        {selectedRoll ? (
          <StudentLoginModal roll={selectedRoll} onClose={() => setSelectedRoll(null)} />
        ) : null}
      </main>
    </PageTransition>
  );
}
