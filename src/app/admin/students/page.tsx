"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Shield, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { StudentFormModal } from "@/components/admin/student-form-modal";
import { useDiasData } from "@/hooks/use-dias-data";
import { getAdminSession } from "@/lib/auth";
import { removeStudent } from "@/lib/firebase-queries";
import { showToast } from "@/lib/feedback";
import { StudentRecord } from "@/lib/types";
import { PageTransition } from "@/components/shared/page-transition";

export default function AdminStudentsPage() {
  const router = useRouter();
  const { students } = useDiasData();
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentRecord | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!getAdminSession()) {
      router.replace("/admin/login");
    }
  }, [router]);

  const filtered = students.filter((student) => {
    const value = search.toLowerCase();
    return (
      student.name.toLowerCase().includes(value) ||
      student.roll.toLowerCase().includes(value) ||
      student.department.toLowerCase().includes(value)
    );
  });

  async function handleDeleteStudent() {
    if (!studentToDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      await removeStudent(studentToDelete.id);
      showToast({
        title: "Student deleted",
        message: `${studentToDelete.name} was removed from the directory.`,
        tone: "success"
      });
      setStudentToDelete(null);
    } catch {
      showToast({
        title: "Delete failed",
        message: "The student record could not be removed. Please try again.",
        tone: "error"
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <PageTransition>
      <AdminLayout title="Student Directory" subtitle="Manage enrolled students and IoT credentials.">
        <section className="card-panel">
          <div className="panel-header">
            <div className="search-input">
              <Search size={18} />
              <input
                placeholder="Search by name, roll, dept..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <button type="button" className="primary-button" onClick={() => setShowCreate(true)}>
              <Plus size={18} />
              Enroll Student
            </button>
          </div>

          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Credentials</th>
                  <th>Contact</th>
                  <th>Yearly Attendance</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => {
                  const yearlyAttendance = student.yearlyAttendancePercentage || 0;

                  return (
                    <tr key={student.id}>
                      <td>
                        <div className="student-cell">
                          <div className="avatar-circle">{student.name.charAt(0)}</div>
                          <div>
                            <strong>{student.name}</strong>
                            <p>
                              {student.roll} - {student.department}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="badge-row">
                          <span className="tag tag-success">
                            <Shield size={14} />
                            RFID
                          </span>
                          <span className="tag tag-info">FP ID {student.fingerprintId}</span>
                        </div>
                      </td>
                      <td>
                        <p>{student.email || "No email"}</p>
                        <small>{student.phone || "No phone"}</small>
                      </td>
                      <td>
                        <div className="progress-text">{yearlyAttendance}%</div>
                        <div className="progress-bar">
                          <span style={{ width: `${yearlyAttendance}%` }} />
                        </div>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => setSelectedStudent(student)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => setStudentToDelete(student)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {showCreate ? (
          <StudentFormModal onClose={() => setShowCreate(false)} mode="create" />
        ) : null}

        {selectedStudent ? (
          <StudentFormModal
            onClose={() => setSelectedStudent(null)}
            mode="edit"
            student={selectedStudent}
          />
        ) : null}

        {studentToDelete ? (
          <div className="modal-backdrop">
            <div className="modal-card">
              <button
                type="button"
                className="modal-close"
                onClick={() => setStudentToDelete(null)}
              >
                ×
              </button>
              <h3>Confirm Delete</h3>
              <p>
                Are you sure you want to delete {studentToDelete.name} from the student
                directory?
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setStudentToDelete(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleDeleteStudent}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </AdminLayout>
    </PageTransition>
  );
}
