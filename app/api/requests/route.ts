import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { toPaymentRequestDTO } from "@/lib/dto";

const createRequestSchema = z.object({
  recipientEmail: z.string().email(),
  // Single Zod chain per IG2: parse dollar string → integer minor units
  amountDollars: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a positive number with at most 2 decimal places")
    .transform((s) => Math.round(parseFloat(s) * 100))
    .pipe(z.number().int().positive("Amount must be greater than zero")),
  note: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // After transform, amountDollars is integer minor units
  const { recipientEmail, amountDollars: amountMinorUnits, note } = parsed.data;

  const recipient = await prisma.user.findUnique({
    where: { email: recipientEmail },
  });
  if (!recipient) {
    return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
  }

  // Self-request check via UUID, not email (IG1)
  if (recipient.id === session.userId) {
    return NextResponse.json(
      { error: "Cannot send a payment request to yourself" },
      { status: 422 }
    );
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const paymentRequest = await prisma.paymentRequest.create({
    data: {
      requesterId: session.userId,
      recipientId: recipient.id,
      amountMinorUnits,
      note: note ?? null,
      expiresAt,
    },
    include: { requester: true, recipient: true },
  });

  return NextResponse.json({ request: toPaymentRequestDTO(paymentRequest) }, { status: 201 });
}
