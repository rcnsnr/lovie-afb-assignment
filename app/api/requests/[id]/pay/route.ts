import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { toPaymentRequestDTO } from "@/lib/dto";

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Load request to verify actor before attempting the write
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

  // Simulate payment rail latency — 2–3s random delay (spec AC24)
  await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));

  // Conditional write: only succeeds if status is PENDING and not yet expired (CR1+CR2)
  const now = new Date();
  const result = await prisma.paymentRequest.updateMany({
    where: {
      id: params.id,
      status: "PENDING",
      expiresAt: { gt: now },
    },
    data: {
      status: "PAID",
      paidAt: now,
    },
  });

  // rowsAffected = 0 means already acted on or just expired between read and write
  if (result.count === 0) {
    return NextResponse.json(
      { error: "Request is no longer available for payment" },
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
