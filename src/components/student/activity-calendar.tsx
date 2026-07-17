import { AttendanceLog, HolidayRecord, LeaveRequestRecord } from "@/lib/types";
import { buildMonthCalendar } from "@/lib/attendance";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ActivityCalendar({
  logs,
  holidays,
  leaveRequests = [],
  month
}: {
  logs: AttendanceLog[];
  holidays: HolidayRecord[];
  leaveRequests?: LeaveRequestRecord[];
  month: string;
}) {
  const referenceDate = getReferenceDateForMonth(month);
  const days = buildMonthCalendar(logs, holidays, leaveRequests, referenceDate);
  const holidayLabelMap = new Map(
    holidays.map((holiday) => [holiday.date, holiday.label])
  );
  const leaveLabelMap = new Map(
    leaveRequests
      .filter((request) => request.status === "ACCEPTED")
      .map((request) => [request.date, request.reason])
  );
  const currentMonthLabel = referenceDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric"
  });
  const todayKey = getLocalDateKey(new Date());

  return (
    <div className="activity-calendar-shell">
      <div className="calendar-month-label">{currentMonthLabel}</div>
      <div className="calendar-weekdays">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="activity-calendar">
        {days.map((day) => {
          const isSundayHoliday =
            day.type === "holiday" &&
            /^\d{4}-\d{2}-\d{2}$/.test(day.date) &&
            new Date(`${day.date}T00:00:00`).getDay() === 0;
          const holidayLabel = holidayLabelMap.get(day.date);
          const leaveLabel = leaveLabelMap.get(day.date);
          const title =
            day.type === "holiday"
              ? holidayLabel
                ? `${day.date} | ${holidayLabel}`
                : isSundayHoliday
                  ? `${day.date} | Sunday`
                  : `${day.date} | Holiday`
              : day.type === "leave"
                ? `${day.date} | Approved Leave${leaveLabel ? `: ${leaveLabel}` : ""}`
              : `${day.date} | ${day.type}`;

          return (
            <div
              key={day.date}
              className={`calendar-day calendar-day--${day.type} ${day.date === todayKey ? "calendar-day--today" : ""}`}
              title={title}
            >
              {day.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getReferenceDateForMonth(month: string) {
  if (!month) return new Date();

  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const today = new Date();

  if (year === today.getFullYear() && monthIndex === today.getMonth()) {
    return today;
  }

  return new Date(year, monthIndex + 1, 0);
}
