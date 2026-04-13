"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface SearchInputProps {
  basePath: string; // e.g. "/dashboard/outgoing"
  placeholder?: string;
}

export function SearchInput({
  basePath,
  placeholder = "Search by name, email, or phone…",
}: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("search") ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      // Merge with existing params so ?status= is preserved
      const params = new URLSearchParams(searchParams.toString());
      if (q.trim()) {
        params.set("search", q.trim());
      } else {
        params.delete("search");
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
