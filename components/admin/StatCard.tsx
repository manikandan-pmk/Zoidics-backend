import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
          <Icon size={19} />
        </div>

        <span className="text-[10px] uppercase tracking-[0.15em] text-black/30">
          Overview
        </span>
      </div>

      <p className="text-sm text-black/45">{title}</p>

      <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>

      <p className="mt-2 text-xs text-black/40">{description}</p>
    </div>
  );
}
