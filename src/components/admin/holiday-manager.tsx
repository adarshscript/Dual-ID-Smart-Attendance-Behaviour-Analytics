"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { addHoliday, removeHoliday } from "@/lib/firebase-queries";
import { showToast } from "@/lib/feedback";
import { HolidayRecord } from "@/lib/types";

export function HolidayManager({ holidays }: { holidays: HolidayRecord[] }) {
  const [date, setDate] = useState("");
  const [label, setLabel] = useState("");
  const [removingId, setRemovingId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [holidayToDelete, setHolidayToDelete] = useState<HolidayRecord | null>(null);

  const sortedHolidays = useMemo(
    () =>
      [...holidays].sort((a, b) => {
        if (a.date === b.date) return a.label.localeCompare(b.label);
        return a.date.localeCompare(b.date);
      }),
    [holidays]
  );

  const filteredHolidays = useMemo(
    () => sortedHolidays.filter((holiday) => holiday.date.startsWith(selectedMonth)),
    [selectedMonth, sortedHolidays]
  );

  return (
    <div className="card-panel">
      <div className="panel-header">
        <div>
          <h3>Holiday Calendar</h3>
          <p>Mark a holiday once and it appears blue on every student calendar.</p>
        </div>
      </div>

      <div className="stack-form">
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <input
          placeholder="Holiday label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
        <button
          type="button"
          className="primary-button"
          onClick={async () => {
            if (date) {
              await addHoliday(date, label || "Campus Holiday");
              setDate("");
              setLabel("");
              showToast({
                title: "Holiday saved",
                message: "The selected date will now appear as a holiday on all calendars.",
                tone: "success"
              });
              return;
            }

            showToast({
              title: "Date missing",
              message: "Please select a date before saving a holiday.",
              tone: "error"
            });
          }}
        >
          Save Holiday
        </button>
      </div>

      <div className="stack-form" style={{ marginTop: "1rem" }}>
        <input
          type="month"
          value={selectedMonth}
          onChange={(event) => setSelectedMonth(event.target.value)}
        />
      </div>

      {filteredHolidays.length ? (
        <div className="stacked-notes" style={{ marginTop: "1rem" }}>
          {filteredHolidays.map((holiday) => (
            <div key={holiday.id} className="shortcut-item">
              <div className="label-row">
                <div>
                  <strong>{holiday.label || "Campus Holiday"}</strong>
                  <p>{holiday.date}</p>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setHolidayToDelete(holiday)}
                  disabled={removingId === holiday.id}
                  aria-label={`Remove ${holiday.label || "holiday"}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="stacked-notes" style={{ marginTop: "1rem" }}>
          <div className="shortcut-item">
            <p>No holidays found for the selected month.</p>
          </div>
        </div>
      )}

      {holidayToDelete ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <button
              type="button"
              className="modal-close"
              onClick={() => setHolidayToDelete(null)}
            >
              ×
            </button>
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to remove {holidayToDelete.label || "this holiday"} from{" "}
              {holidayToDelete.date}?
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setHolidayToDelete(null)}
                disabled={removingId === holidayToDelete.id}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={async () => {
                  try {
                    setRemovingId(holidayToDelete.id);
                    await removeHoliday(holidayToDelete.id);
                    showToast({
                      title: "Holiday removed",
                      message: "The holiday has been removed from all student calendars.",
                      tone: "success"
                    });
                    setHolidayToDelete(null);
                  } catch {
                    showToast({
                      title: "Remove failed",
                      message: "The holiday could not be removed. Please try again.",
                      tone: "error"
                    });
                  } finally {
                    setRemovingId("");
                  }
                }}
                disabled={removingId === holidayToDelete.id}
              >
                {removingId === holidayToDelete.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
