import { ContactMetrics } from "@/lib/contact-metrics";
import { formatCents } from "@/lib/money";

type ContactInfo = {
  name: string;
  email: string;
  phone: string | null;
};

/**
 * Inline contact summary card rendered below the search input when a dashboard
 * search resolves to exactly one counterparty.
 *
 * Server-safe: no "use client", no hooks, no data fetching.
 * Layout: identity block left + metrics block right on md+; stacked on mobile.
 */
export function ContactSummaryCard({
  contact,
  metrics,
}: {
  contact: ContactInfo;
  metrics: ContactMetrics;
}) {
  return (
    <div
      data-testid="contact-summary-card"
      className="rounded-xl bg-white ring-1 ring-blue-100 shadow-sm p-4"
    >
      <div className="flex flex-col gap-3 md:flex-row md:gap-6">
        {/* Identity block — left on desktop, first on mobile */}
        <div className="flex flex-col gap-0.5 md:min-w-[160px]">
          <p className="text-sm font-semibold text-slate-900">{contact.name}</p>
          <p className="text-sm text-slate-600">{contact.email}</p>
          {contact.phone !== null && <p className="text-sm text-slate-500">{contact.phone}</p>}
        </div>

        {/* Metrics block — right on desktop, second on mobile */}
        <div className="flex flex-col gap-2 md:flex-1">
          {/* Direction counts */}
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-slate-500">Sent</p>
              <p className="text-sm font-medium text-slate-900">{metrics.outgoingCount}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Received</p>
              <p className="text-sm font-medium text-slate-900">{metrics.incomingCount}</p>
            </div>
          </div>

          {/* Dollar aggregates (CANCELLED + EXPIRED excluded) */}
          <div className="flex gap-6 flex-wrap">
            <div>
              <p className="text-xs text-slate-500">Pending</p>
              <p className="text-sm font-medium text-slate-900">
                {formatCents(metrics.pendingAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Paid</p>
              <p className="text-sm font-medium text-slate-900">
                {formatCents(metrics.paidAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Declined</p>
              <p className="text-sm font-medium text-slate-900">
                {formatCents(metrics.declinedAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
