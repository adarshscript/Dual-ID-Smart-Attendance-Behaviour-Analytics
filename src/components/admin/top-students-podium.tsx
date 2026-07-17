import { StudentRecord } from "@/lib/types";

export function TopStudentsPodium({ students }: { students: StudentRecord[] }) {
  return (
    <div className="card-panel">
      <div className="panel-header">
        <div>
          <h3>Top 3 Students</h3>
          <p>Highest attendance performers this cycle.</p>
        </div>
      </div>

      <div className="podium-grid">
        {students.map((student, index) => (
          <div key={student.id} className={`podium-card podium-card--${index + 1}`}>
            <span className="podium-rank">#{index + 1}</span>
            <div className="podium-avatar">{student.name.charAt(0)}</div>
            <strong>{student.name}</strong>
            <p>{student.roll}</p>
            <small>{student.monthlyAttendancePercentage || 0}% monthly attendance</small>
          </div>
        ))}
      </div>
    </div>
  );
}
