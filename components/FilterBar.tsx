"use client";

import { useRouter } from "next/navigation";

const STATUSES = ["ALL", "PENDING", "PAID", "DECLINED", "CANCELLED", "EXPIRED"] as const;
type Status = (typeof STATUSES)[number];

interface FilterBarProps {
  activeStatus: string;
  basePath: string; // e.g. "/dashboard/outgoing"
}

export function FilterBar({ activeStatus, basePath }: FilterBarProps) {
  const router = useRouter();
  const current = STATUSES.includes(activeStatus as Status) ? activeStatus : "ALL";

  function handleSelect(status: Status) {
    const url = status === "ALL" ? basePath : `${basePath}?status=${status}`;
    router.push(url);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map((status) => {
        const isActive = status === current;
        return (
          <button
            key={status}
            type="button"
            onClick={() => handleSelect(status)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              isActive
                ? "bg-blue-600 text-white"
                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {status}
          </button>
        );
      })}
    </div>
  );
}
