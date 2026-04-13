import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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
    where: { requesterId: session.userId },
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

  // Search: case-insensitive substring match on recipient name, email, phone (OR logic).
  // Null phone guarded with ?? '' to avoid .toLowerCase() crash.
  const searchParam = request.nextUrl.searchParams.get("search")?.trim().toLowerCase();
  const requests = searchParam
    ? statusFiltered.filter((r) => {
        const q = searchParam;
        return (
          r.recipientName.toLowerCase().includes(q) ||
          r.recipientEmail.toLowerCase().includes(q) ||
          (r.recipientPhone ?? "").toLowerCase().includes(q)
        );
      })
    : statusFiltered;

  return NextResponse.json({ requests });
}

const createRequestSchema = z
  .object({
    recipientEmail: z.string().email().optional(),
    recipientPhone: z
      .string()
      .regex(/^\+?[1-9]\d{6,14}$/, "Phone must be E.164-like format (e.g. +15551234567)")
      .optional(),
    // Single Zod chain per IG2: parse dollar string → integer minor units
    amountDollars: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a positive number with at most 2 decimal places")
      .transform((s) => Math.round(parseFloat(s) * 100))
      .pipe(z.number().int().positive("Amount must be greater than zero")),
    note: z.string().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    const hasEmail = !!data.recipientEmail;
    const hasPhone = !!data.recipientPhone;
    if (hasEmail === hasPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide exactly one of recipientEmail or recipientPhone",
        path: [hasEmail ? "recipientEmail" : "recipientPhone"],
      });
    }
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

  const { recipientEmail, recipientPhone, amountDollars: amountMinorUnits, note } = parsed.data;

  // Lookup recipient by whichever identifier was provided
  const recipient = recipientEmail
    ? await prisma.user.findUnique({ where: { email: recipientEmail } })
    : await prisma.user.findUnique({ where: { phone: recipientPhone } });

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
