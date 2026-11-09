import { NextResponse, type NextRequest } from "next/server";
import { revalidatePublic } from "@/lib/action-helpers";
import {
  markOrderPaidInDb,
  verifyPaystackWebhookSignature,
} from "@/lib/paystack";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    event?: string;
    data?: {
      reference?: string;
      status?: string;
      paid_at?: string;
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (
    event.event === "charge.success" &&
    event.data?.status === "success" &&
    event.data?.reference
  ) {
    await markOrderPaidInDb(event.data.reference, event.data.paid_at ?? null);
    revalidatePublic();
  }

  return NextResponse.json({ received: true });
}
