"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface SearchInputProps {
  basePath: string;
  placeholder?: string;
  initialSearch?: string;
  currentStatus?: string;
}

export function SearchInput({
  basePath,
  placeholder = "Search by name, email, or phone…",
  initialSearch,
  currentStatus,
}: SearchInputProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialSearch ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusRef = useRef(currentStatus);

  useEffect(() => {
    statusRef.current = currentStatus;
  }, [currentStatus]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setValue(q);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (statusRef.current && statusRef.current !== "ALL") {
        params.set("status", statusRef.current);
      }
      if (q.trim()) {
        params.set("search", q.trim());
      }
      const qs = params.toString();
      router.replace(qs ? `${basePath}?${qs}` : basePath);
    }, 300);
  }

  return (
    <input
      type="search"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
  );
}
