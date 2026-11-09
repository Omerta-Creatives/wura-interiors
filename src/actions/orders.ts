"use server";

import {
  UNAUTHORISED,
  dbFailure,
  fail,
  revalidatePublic,
  succeed,
  type ActionResult,
} from "@/lib/action-helpers";
import { getAdmin } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import {
  orderStatusSchema,
  paymentStatusSchema,
  uuidSchema,
} from "@/lib/validation";

export async function updateOrderStatus(
  orderId: string,
  orderStatus: string,
): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const parsedId = uuidSchema.safeParse(orderId);
  const parsedStatus = orderStatusSchema.safeParse(orderStatus);
  if (!parsedId.success || !parsedStatus.success) return fail("Invalid request.");

  try {
    const { rowCount } = await dbQuery(
      `UPDATE orders SET order_status = $1, updated_at = NOW() WHERE id = $2`,
      [parsedStatus.data, parsedId.data],
    );
    if (!rowCount) return fail("Order not found.");

    revalidatePublic();
    return succeed("Order fulfilment status updated.");
  } catch (err) {
    return dbFailure(err as { code?: string; message?: string });
  }
}

export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: string,
): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return UNAUTHORISED;

  const parsedId = uuidSchema.safeParse(orderId);
  const parsedStatus = paymentStatusSchema.safeParse(paymentStatus);
  if (!parsedId.success || !parsedStatus.success) return fail("Invalid request.");

  try {
    const { rowCount } = await dbQuery(
      `UPDATE orders
       SET payment_status = $1,
           paid_at = CASE WHEN $1 = 'paid' THEN COALESCE(paid_at, NOW()) ELSE paid_at END,
           updated_at = NOW()
       WHERE id = $2`,
      [parsedStatus.data, parsedId.data],
    );
    if (!rowCount) return fail("Order not found.");

    revalidatePublic();
    return succeed("Order payment status updated.");
  } catch (err) {
    return dbFailure(err as { code?: string; message?: string });
  }
}
