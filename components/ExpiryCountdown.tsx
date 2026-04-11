"use client";

import { useEffect, useState } from "react";

interface Props {
  expiresAt: string;
  /** Only rendered for PENDING status; pass status to guard display. */
  status: string;
}

function getRemainingLabel(expiresAt: string): string | null {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  if (minutes > 0) return `${minutes}m ${seconds}s left`;
  return `${seconds}s left`;
}

export function ExpiryCountdown({ expiresAt, status }: Props) {
  const [label, setLabel] = useState<string | null>(() => getRemainingLabel(expiresAt));

  useEffect(() => {
    if (status !== "PENDING") return;

    const tick = () => setLabel(getRemainingLabel(expiresAt));
    tick();

    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, status]);

  // Only show for PENDING; hide once expired
  if (status !== "PENDING" || label === null) return null;

  return <span className="text-xs text-gray-400">{label}</span>;
}
