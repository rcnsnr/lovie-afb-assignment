"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewRequestPage() {
  const router = useRouter();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amountDollars, setAmountDollars] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    // Client-side pre-validation (mirrors server rules)
    const clientErrors: Record<string, string> = {};
    if (!/^\d+(\.\d{1,2})?$/.test(amountDollars) || parseFloat(amountDollars) <= 0) {
      clientErrors.amountDollars = "Enter a positive dollar amount (e.g. 15.00)";
    }
    if (note.length > 200) {
      clientErrors.note = "Note must be 200 characters or fewer";
    }
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail,
          amountDollars,
          note: note || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/requests/${data.request.id}`);
        return;
      }

      const data = await res.json();
      if (res.status === 404) {
        setFormError("No account found with that email address.");
      } else if (res.status === 422) {
        setFormError("You cannot send a payment request to yourself.");
      } else if (res.status === 400 && data.issues) {
        // Map Zod issues to field errors
        const fieldErrors: Record<string, string> = {};
        for (const issue of data.issues as { path: string[]; message: string }[]) {
          const key = issue.path[0];
          if (key) fieldErrors[key] = issue.message;
        }
        setErrors(fieldErrors);
      } else {
        setFormError(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setFormError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Request money</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200"
      >
        {/* Recipient email */}
        <div>
          <label htmlFor="recipientEmail" className="mb-1 block text-sm font-medium text-gray-700">
            Recipient email
          </label>
          <input
            id="recipientEmail"
            type="email"
            required
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="bob@example.com"
          />
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amountDollars" className="mb-1 block text-sm font-medium text-gray-700">
            Amount (USD)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-500">
              $
            </span>
            <input
              id="amountDollars"
              type="text"
              inputMode="decimal"
              required
              value={amountDollars}
              onChange={(e) => setAmountDollars(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-7 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="15.00"
            />
          </div>
          {errors.amountDollars && (
            <p className="mt-1 text-xs text-red-600">{errors.amountDollars}</p>
          )}
        </div>

        {/* Note */}
        <div>
          <label htmlFor="note" className="mb-1 block text-sm font-medium text-gray-700">
            Note <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <textarea
            id="note"
            rows={3}
            maxLength={200}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Dinner split"
          />
          <p className="mt-0.5 text-right text-xs text-gray-400">{note.length}/200</p>
          {errors.note && <p className="mt-1 text-xs text-red-600">{errors.note}</p>}
        </div>

        {/* Form-level error */}
        {formError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send request"}
          </button>
        </div>
      </form>
    </div>
  );
}
