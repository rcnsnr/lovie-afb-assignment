import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { toPaymentRequestDTO } from "@/lib/dto";

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await prisma.paymentRequest.findMany({
    where: { recipientId: session.userId },
    include: { requester: true, recipient: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests: requests.map(toPaymentRequestDTO) });
}
