import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { toPaymentRequestDTO } from "@/lib/dto";
import { PaymentRequestDTO } from "@/lib/dto";
import { redirect } from "next/navigation";

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
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colours[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return null;
  const hours = Math.floor(ms / 1000 / 60 / 60);
  const days = Math.floor(hours / 24);
  const label = days > 0 ? `${days}d left` : `${hours}h left`;
  return <span className="text-xs text-gray-400">{label}</span>;
}

function RequestRow({ req }: { req: PaymentRequestDTO }) {
  return (
    <Link
      href={`/requests/${req.id}`}
      className="flex items-center justify-between rounded-lg px-4 py-3 hover:bg-gray-50"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{req.requesterEmail}</p>
        {req.note && <p className="truncate text-xs text-gray-500">{req.note}</p>}
      </div>
      <div className="ml-4 flex shrink-0 flex-col items-end gap-1">
        <span className="text-sm font-semibold text-gray-900">{req.amountDisplay}</span>
        <StatusBadge status={req.status} />
        {req.status === "PENDING" && <ExpiryCountdown expiresAt={req.expiresAt} />}
      </div>
    </Link>
  );
}

export default async function IncomingDashboardPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const rows = await prisma.paymentRequest.findMany({
    where: { recipientId: session.userId },
    include: { requester: true, recipient: true },
    orderBy: { createdAt: "desc" },
  });
  const requests = rows.map(toPaymentRequestDTO);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Received requests</h1>
        <Link
          href="/requests/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New request
        </Link>
      </div>

      <div className="mb-4 flex gap-4 border-b border-gray-200 text-sm">
        <Link href="/dashboard/outgoing" className="pb-2 text-gray-500 hover:text-gray-700">
          Sent
        </Link>
        <span className="border-b-2 border-blue-600 pb-2 font-medium text-blue-600">Received</span>
      </div>

      {requests.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">No incoming requests yet.</p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          {requests.map((req) => (
            <RequestRow key={req.id} req={req} />
          ))}
        </div>
      )}
    </div>
  );
}
