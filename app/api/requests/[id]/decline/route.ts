import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { toPaymentRequestDTO } from "@/lib/dto";

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.paymentRequest.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Recipient-only action
  if (existing.recipientId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Conditional write: only succeeds if status is PENDING and not yet expired (CR1+CR2)
  const now = new Date();
  const result = await prisma.paymentRequest.updateMany({
    where: {
      id: params.id,
      status: "PENDING",
      expiresAt: { gt: now },
    },
    data: {
      status: "DECLINED",
      declinedAt: now,
    },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "Request is no longer available for this action" },
      { status: 409 }
    );
  }

  // updateMany returns no record — fetch for DTO (U3 pattern)
  const updated = await prisma.paymentRequest.findUnique({
    where: { id: params.id },
    include: { requester: true, recipient: true },
  });

  return NextResponse.json({ request: toPaymentRequestDTO(updated!) });
}
