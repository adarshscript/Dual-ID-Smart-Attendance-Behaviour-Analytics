import { AttendanceLog } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

export function AttendanceTable({ rows }: { rows: AttendanceLog[] }) {
  return (
    <div className="table-shell">
      <table className="data-table">
        <thead>
          <tr>
            <th>Roll No</th>
            <th>Name</th>
            <th>Date/Time</th>
            <th>Status</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 30).map((row) => (
            <tr key={row.id}>
              <td>{row.roll}</td>
              <td>{row.name}</td>
              <td>{formatDateTime(row.datetime)}</td>
              <td>
                <span className={`status-pill status-pill--${row.status.toLowerCase()}`}>
                  {row.status}
                </span>
              </td>
              <td>{row.durationLabel || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
