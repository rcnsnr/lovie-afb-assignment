import { PaymentRequestDTO, toPaymentRequestDTO } from "./dto";
import { prisma } from "./prisma";

export type ContactMetrics = {
  outgoingCount: number;
  incomingCount: number;
  pendingAmount: number;
  paidAmount: number;
  declinedAmount: number;
};

type ContactIdentity = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

/**
 * Given a search term and the current dashboard's full (pre-status-filter) DTO list,
 * return the single matched counterparty if exactly one unique contact matches the
 * F10 case-insensitive substring rules. Returns null for empty search, zero matches,
 * or multiple matches.
 *
 * direction "outgoing": counterparty is the recipient
 * direction "incoming": counterparty is the requester
 */
export function resolveMatchedContact(
  search: string,
  dtos: PaymentRequestDTO[],
  direction: "outgoing" | "incoming"
): ContactIdentity | null {
  if (!search.trim()) return null;

  const q = search.toLowerCase();
  const contactMap = new Map<string, ContactIdentity>();

  for (const dto of dtos) {
    const id = direction === "outgoing" ? dto.recipientId : dto.requesterId;
    const name = direction === "outgoing" ? dto.recipientName : dto.requesterName;
    const email = direction === "outgoing" ? dto.recipientEmail : dto.requesterEmail;
    const phone = direction === "outgoing" ? dto.recipientPhone : dto.requesterPhone;

    // F10 OR logic: match on name, email, or phone (all case-insensitive substrings)
    const matches =
      name.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      (phone ?? "").toLowerCase().includes(q);

    if (matches && !contactMap.has(id)) {
      contactMap.set(id, { id, name, email, phone });
    }
  }

  if (contactMap.size !== 1) return null;
  return contactMap.values().next().value as ContactIdentity;
}

/**
 * Fetch all PaymentRequests between userId and contactId in both directions,
 * apply effective-status computation via toPaymentRequestDTO, and return
 * relationship metric counts and dollar aggregates scoped to userId.
 *
 * CANCELLED and EXPIRED are excluded from dollar aggregates per spec F13.
 */
export async function computeContactMetrics(
  userId: string,
  contactId: string
): Promise<ContactMetrics> {
  const rows = await prisma.paymentRequest.findMany({
    where: {
      OR: [
        { requesterId: userId, recipientId: contactId },
        { requesterId: contactId, recipientId: userId },
      ],
    },
    include: { requester: true, recipient: true },
  });

  const dtos = rows.map(toPaymentRequestDTO);

  let outgoingCount = 0;
  let incomingCount = 0;
  let pendingAmount = 0;
  let paidAmount = 0;
  let declinedAmount = 0;

  for (const dto of dtos) {
    if (dto.requesterId === userId) outgoingCount++;
    if (dto.recipientId === userId) incomingCount++;
    // Use effective status (already computed by toPaymentRequestDTO via getEffectiveStatus)
    if (dto.status === "PENDING") pendingAmount += dto.amountMinorUnits;
    if (dto.status === "PAID") paidAmount += dto.amountMinorUnits;
    if (dto.status === "DECLINED") declinedAmount += dto.amountMinorUnits;
    // CANCELLED and EXPIRED: counted in outgoing/incoming totals, excluded from amounts
  }

  return { outgoingCount, incomingCount, pendingAmount, paidAmount, declinedAmount };
}
