import { LucideIcon } from "lucide-react";

export function StatCard({
  title,
  value,
  icon: Icon
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="stat-card">
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
      </div>
      <div className="stat-icon">
        <Icon size={20} />
      </div>
    </div>
  );
}
