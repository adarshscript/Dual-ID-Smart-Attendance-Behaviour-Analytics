import { format } from "date-fns";

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "MMM dd, yyyy - HH:mm:ss");
}
