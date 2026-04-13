import { PaymentRequest, User } from "@prisma/client";
import { getEffectiveStatus } from "./requests";
import { formatCents } from "./money";

type PaymentRequestWithRelations = PaymentRequest & {
  requester: User;
  recipient: User;
};

export interface PaymentRequestDTO {
  id: string;
  requesterId: string;
  recipientId: string;
  requesterEmail: string;
  requesterName: string;
  requesterPhone: string | null;
  recipientEmail: string;
  recipientName: string;
  recipientPhone: string | null;
  amountDisplay: string;
  amountMinorUnits: number;
  note: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
  paidAt: string | null;
  declinedAt: string | null;
  cancelledAt: string | null;
}

export function toPaymentRequestDTO(req: PaymentRequestWithRelations): PaymentRequestDTO {
  return {
    id: req.id,
    requesterId: req.requesterId,
    recipientId: req.recipientId,
    requesterEmail: req.requester.email,
    requesterName: req.requester.name,
    requesterPhone: req.requester.phone ?? null,
    recipientEmail: req.recipient.email,
    recipientName: req.recipient.name,
    recipientPhone: req.recipient.phone ?? null,
    amountDisplay: formatCents(req.amountMinorUnits),
    amountMinorUnits: req.amountMinorUnits,
    note: req.note,
    status: getEffectiveStatus(req),
    expiresAt: req.expiresAt.toISOString(),
    createdAt: req.createdAt.toISOString(),
    paidAt: req.paidAt?.toISOString() ?? null,
    declinedAt: req.declinedAt?.toISOString() ?? null,
    cancelledAt: req.cancelledAt?.toISOString() ?? null,
  };
}
