import { NextResponse } from "next/server";

/**
 * Stripe webhook receiver — verify signature in production (`stripe.webhooks.constructEvent`).
 * Billing mutations should call `billing.service` / repositories once events are mapped.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    data: {
      received: true,
      hint: "Wire Stripe signing secret + customer.subscription.updated handlers here.",
      echoType: typeof payload === "object" && payload !== null && "type" in payload
        ? String((payload as { type?: string }).type)
        : undefined,
    },
  });
}
