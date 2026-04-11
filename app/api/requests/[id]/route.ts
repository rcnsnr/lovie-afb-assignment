import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { toPaymentRequestDTO } from "@/lib/dto";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paymentRequest = await prisma.paymentRequest.findUnique({
    where: { id: params.id },
    include: { requester: true, recipient: true },
  });

  if (!paymentRequest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ request: toPaymentRequestDTO(paymentRequest) });
}
