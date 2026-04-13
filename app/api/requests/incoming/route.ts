import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { toPaymentRequestDTO } from "@/lib/dto";

const VALID_STATUSES = ["PENDING", "PAID", "DECLINED", "CANCELLED", "EXPIRED"] as const;

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.paymentRequest.findMany({
    where: { recipientId: session.userId },
    include: { requester: true, recipient: true },
    orderBy: { createdAt: "desc" },
  });

  // Filter AFTER toPaymentRequestDTO so EXPIRED is computed from effective status,
  // not raw DB status — a DB-level WHERE would miss implicitly-expired PENDING rows.
  const dtos = rows.map(toPaymentRequestDTO);

  const statusParam = request.nextUrl.searchParams.get("status")?.toUpperCase();
  const statusFiltered =
    statusParam && VALID_STATUSES.includes(statusParam as (typeof VALID_STATUSES)[number])
      ? dtos.filter((r) => r.status === statusParam)
      : dtos;

  // Search: case-insensitive substring match on requester name, email, phone (OR logic).
  // Null phone guarded with ?? '' to avoid .toLowerCase() crash.
  const searchParam = request.nextUrl.searchParams.get("search")?.trim().toLowerCase();
  const requests = searchParam
    ? statusFiltered.filter((r) => {
        const q = searchParam;
        return (
          r.requesterName.toLowerCase().includes(q) ||
          r.requesterEmail.toLowerCase().includes(q) ||
          (r.requesterPhone ?? "").toLowerCase().includes(q)
        );
      })
    : statusFiltered;

  return NextResponse.json({ requests });
}
