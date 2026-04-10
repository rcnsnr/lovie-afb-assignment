import { RequestStatus } from "@prisma/client";

interface RequestLike {
  status: RequestStatus;
  expiresAt: Date;
}

/**
 * Returns the effective status of a payment request.
 * A PENDING request whose expiresAt is in the past is treated as EXPIRED.
 * All other statuses are returned as-is.
 */
export function getEffectiveStatus(request: RequestLike): RequestStatus {
  if (request.status === RequestStatus.PENDING && request.expiresAt < new Date()) {
    return RequestStatus.EXPIRED;
  }
  return request.status;
}
