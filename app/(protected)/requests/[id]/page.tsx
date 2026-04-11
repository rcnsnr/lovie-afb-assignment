"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PaymentRequestDTO } from "@/lib/dto";
import { ExpiryCountdown } from "@/components/ExpiryCountdown";

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PAID: "bg-green-100 text-green-800",
    DECLINED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-700",
    EXPIRED: "bg-orange-100 text-orange-800",
  };
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${colours[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [req, setReq] = useState<PaymentRequestDTO | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRequest = useCallback(async () => {
    const [reqRes, meRes] = await Promise.all([
      fetch(`/api/requests/${id}`),
      fetch("/api/auth/me"),
    ]);
    if (reqRes.status === 404) {
      setNotFound(true);
      return;
    }
    if (reqRes.ok) {
      const data = await reqRes.json();
      setReq(data.request);
    }
    if (meRes.ok) {
      const me = await meRes.json();
      setCurrentUserId(me.user.id);
    }
  }, [id]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  async function handleAction(action: "pay" | "decline" | "cancel") {
    if (!req) return;
    setActionError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${req.id}/${action}`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setReq(data.request);
      } else {
        const data = await res.json();
        setActionError(data.error ?? "Action failed. Please try again.");
        // Refresh to reflect actual server state
        await fetchRequest();
      }
    } catch {
      setActionError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="mb-4 text-lg font-medium text-gray-900">Request not found</p>
        <p className="mb-6 text-sm text-gray-500">
          This request may have been removed or the link is invalid.
        </p>
        <Link href="/dashboard/outgoing" className="text-sm text-blue-600 hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!req) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-gray-400">Loading…</div>
    );
  }

  const isRecipient = currentUserId === req.recipientId;
  const isRequester = currentUserId === req.requesterId;
  const isPending = req.status === "PENDING";

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-4">
        <Link href="/dashboard/outgoing" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back
        </Link>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{req.amountDisplay}</p>
              <ExpiryCountdown expiresAt={req.expiresAt} status={req.status} />
            </div>
            <StatusBadge status={req.status} />
          </div>
        </div>

        {/* Details */}
        <div className="divide-y divide-gray-100 px-6">
          <DetailRow label="From" value={`${req.requesterName} (${req.requesterEmail})`} />
          <DetailRow label="To" value={`${req.recipientName} (${req.recipientEmail})`} />
          {req.note && <DetailRow label="Note" value={req.note} />}
          <DetailRow label="Created" value={new Date(req.createdAt).toLocaleDateString()} />
          <DetailRow label="Expires" value={new Date(req.expiresAt).toLocaleDateString()} />
          {req.paidAt && (
            <DetailRow label="Paid at" value={new Date(req.paidAt).toLocaleString()} />
          )}
          {req.declinedAt && (
            <DetailRow label="Declined at" value={new Date(req.declinedAt).toLocaleString()} />
          )}
          {req.cancelledAt && (
            <DetailRow label="Cancelled at" value={new Date(req.cancelledAt).toLocaleString()} />
          )}
        </div>

        {/* Action buttons — shown only for correct actor on PENDING requests */}
        {isPending && (isRecipient || isRequester) && (
          <div className="border-t border-gray-100 px-6 py-4">
            {actionError && (
              <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {actionError}
              </p>
            )}
            <div className="flex gap-3">
              {isRecipient && (
                <>
                  <button
                    onClick={() => handleAction("pay")}
                    disabled={loading}
                    className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? "Processing…" : "Pay"}
                  </button>
                  <button
                    onClick={() => handleAction("decline")}
                    disabled={loading}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Decline
                  </button>
                </>
              )}
              {isRequester && (
                <button
                  onClick={() => handleAction("cancel")}
                  disabled={loading}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {loading ? "Cancelling…" : "Cancel request"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Back to dashboard link */}
      <div className="mt-4 text-center">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">
          Back
        </button>
      </div>
    </div>
  );
}
