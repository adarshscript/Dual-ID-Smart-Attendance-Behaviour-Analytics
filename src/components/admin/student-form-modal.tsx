"use client";

import { FormEvent, useState } from "react";
import { saveStudent } from "@/lib/firebase-queries";
import { StudentRecord } from "@/lib/types";
import { showToast } from "@/lib/feedback";

type StudentFormState = {
  name: string;
  roll: string;
  department: string;
  email: string;
  phone: string;
  rfidTag: string;
  fingerprintId: string;
};

function createInitialState(student?: StudentRecord): StudentFormState {
  return {
    name: student?.name || "",
    roll: student?.roll || "",
    department: student?.department || "Computer Science",
    email: student?.email || "",
    phone: student?.phone || "",
    rfidTag: student?.rfidTag || "",
    fingerprintId: student?.fingerprintId || ""
  };
}

export function StudentFormModal({
  student,
  mode,
  onClose
}: {
  student?: StudentRecord;
  mode: "create" | "edit";
  onClose: () => void;
}) {
  const [form, setForm] = useState<StudentFormState>(createInitialState(student));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !form.roll.trim()) {
      showToast({
        title: "Required fields missing",
        message: "Student name and roll number are required.",
        tone: "error"
      });
      return;
    }

    await saveStudent({
      id: student?.id,
      ...form
    });

    showToast({
      title: mode === "create" ? "Student enrolled" : "Student updated",
      message:
        mode === "create"
          ? "The new student has been added successfully."
          : "The student record has been updated successfully.",
      tone: "success"
    });
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card modal-card--wide">
        <button type="button" className="modal-close" onClick={onClose}>
          ×
        </button>
        <h3>{mode === "create" ? "Enroll New Student" : "Edit Student"}</h3>
        <p>
          {mode === "create"
            ? "Enter details to register a new student to the DIAS system."
            : "Update student details and credentials."}
        </p>

        <form onSubmit={handleSubmit} className="stack-form">
          <label>
            Full Name
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="John Doe"
            />
          </label>

          <div className="form-grid">
            <label>
              Roll Number
              <input
                value={form.roll}
                onChange={(event) => setForm({ ...form, roll: event.target.value })}
                placeholder="CS2101"
              />
            </label>
            <label>
              Department
              <input
                value={form.department}
                onChange={(event) => setForm({ ...form, department: event.target.value })}
                placeholder="Computer Science"
              />
            </label>
          </div>

          <div className="form-grid">
            <label>
              Email (Optional)
              <input
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="john@example.com"
              />
            </label>
            <label>
              Phone (Optional)
              <input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="+91..."
              />
            </label>
          </div>

          <hr />

          <div className="form-grid">
            <label>
              RFID Tag UID
              <input
                value={form.rfidTag}
                onChange={(event) => setForm({ ...form, rfidTag: event.target.value })}
                placeholder="A1B2C3D4"
              />
            </label>
            <label>
              Fingerprint ID
              <input
                value={form.fingerprintId}
                onChange={(event) => setForm({ ...form, fingerprintId: event.target.value })}
                placeholder="FP001"
              />
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              {mode === "create" ? "Enroll Student" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
