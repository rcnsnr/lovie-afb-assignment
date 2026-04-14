import Link from "next/link";

const STATUSES = ["ALL", "PENDING", "PAID", "DECLINED", "CANCELLED", "EXPIRED"] as const;
type Status = (typeof STATUSES)[number];

interface FilterBarProps {
  activeStatus: string;
  basePath: string;
  currentSearch?: string;
}

export function FilterBar({ activeStatus, basePath, currentSearch }: FilterBarProps) {
  const current = STATUSES.includes(activeStatus as Status) ? activeStatus : "ALL";

  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map((status) => {
        const isActive = status === current;
        const params = new URLSearchParams();
        if (currentSearch) params.set("search", currentSearch);
        if (status !== "ALL") params.set("status", status);
        const qs = params.toString();
        const href = qs ? `${basePath}?${qs}` : basePath;

        return (
          <Link
            key={status}
            href={href}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              isActive
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
            }`}
          >
            {status}
          </Link>
        );
      })}
    </div>
  );
}
