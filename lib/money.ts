import { z } from "zod";

/**
 * Parse a dollar string (e.g. "15.00") to integer minor units (e.g. 1500).
 * Throws a ZodError if the input is not a valid positive dollar amount with
 * at most 2 decimal places.
 */
export function parseDollars(input: string): number {
  return z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a positive number with at most 2 decimal places")
    .transform((s) => Math.round(parseFloat(s) * 100))
    .pipe(z.number().int().positive("Amount must be greater than zero"))
    .parse(input);
}

/**
 * Format integer minor units (e.g. 1500) to a dollar string (e.g. "$15.00").
 */
export function formatCents(minorUnits: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(minorUnits / 100);
}
