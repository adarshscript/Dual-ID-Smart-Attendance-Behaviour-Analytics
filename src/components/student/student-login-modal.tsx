"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getStudentPassword, setStudentSession } from "@/lib/auth";
import { useDiasData } from "@/hooks/use-dias-data";
import { showRouteLoading, showToast } from "@/lib/feedback";

export function StudentLoginModal({
  roll,
  onClose
}: {
  roll: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { students } = useDiasData();
  const [name, setName] = useState("");
  const [rollInput, setRollInput] = useState(roll);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const expectedPassword = getStudentPassword(roll);
    const selectedStudent = students.find((student) => student.roll === roll);
    const matchesName =
      selectedStudent?.name.split(" ")[0].toLowerCase() === name.trim().toLowerCase();

    if (matchesName && rollInput.trim() === expectedPassword) {
      setStudentSession(roll);
      showToast({
        title: "Profile unlocked",
        message: `${selectedStudent?.name || "Student"} profile is opening.`,
        tone: "success"
      });
      showRouteLoading("Opening student profile...");
      router.push(`/student/${roll}`);
      return;
    }

    const message = "The first name or roll number does not match the selected student.";
    setError(message);
    showToast({
      title: "Login failed",
      message,
      tone: "error"
    });
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <button type="button" className="modal-close" onClick={onClose}>
          x
        </button>
        <h3>Student Sign In</h3>
        <p>Enter first name and selected roll number to open the profile.</p>
        <form onSubmit={handleSubmit} className="stack-form">
          <label>
            First Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter first name"
            />
          </label>
          <label>
            Roll Number
            <input
              value={rollInput}
              onChange={(event) => setRollInput(event.target.value)}
              placeholder="Enter roll number"
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="primary-button">
            Open Profile
          </button>
        </form>
      </div>
    </div>
  );
}
