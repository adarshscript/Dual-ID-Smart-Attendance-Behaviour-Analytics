import clsx from "clsx";
import { StudentRecord } from "@/lib/types";

export function LiveStatusPanel({ students }: { students: StudentRecord[] }) {
  return (
    <div className="card-panel soft-dark">
      <div className="panel-header">
        <div>
          <h3>Live Status Campus</h3>
          <p>Current student presence synced from ESP32 and Firebase.</p>
        </div>
      </div>

      <div className="status-stack">
        {students.slice(0, 6).map((student) => (
          <div key={student.id} className="status-row">
            <div className="student-cell">
              <div className="avatar-circle">{student.name.charAt(0)}</div>
              <div>
                <strong>{student.name}</strong>
                <p>{student.roll}</p>
              </div>
            </div>

            <span
              className={clsx("presence-pill", student.isPresent ? "presence-pill--yes" : "presence-pill--no")}
            >
              {student.isPresent ? "Present" : "Absent"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
