"use client";

import { useState } from "react";
import { updateOrderStatus, updatePaymentStatus } from "@/actions/orders";
import { Notice } from "@/components/ui/Notice";
import type { OrderStatus, PaymentStatus } from "@/types";
import { useRunAction } from "./hooks";

const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending Confirmation" },
  { value: "confirmed", label: "Order Confirmed" },
  { value: "in_production", label: "In Atelier / Production" },
  { value: "out_for_delivery", label: "Out for White-Glove Delivery" },
  { value: "delivered", label: "Delivered & Installed" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_STATUSES: { value: PaymentStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid (Verified)" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

export function OrderStatusControls({
  orderId,
  currentOrderStatus,
  currentPaymentStatus,
}: {
  orderId: string;
  currentOrderStatus: OrderStatus;
  currentPaymentStatus: PaymentStatus;
}) {
  const { run, pending, notice } = useRunAction();
  const [orderStatus, setOrderStatus] =
    useState<OrderStatus>(currentOrderStatus);
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>(currentPaymentStatus);

  return (
    <section className="admin-card space-y-6" aria-labelledby="order-controls">
      <div>
        <h2 id="order-controls" className="text-2xl font-medium">
          Update order &amp; payment status
        </h2>
        <p className="mt-1 text-sm text-ink/70">
          Track production progress in the atelier or manually update payment
          verification.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <label htmlFor="order-status-select" className="field-label">
            Fulfilment status
          </label>
          <div className="flex gap-2">
            <select
              id="order-status-select"
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
              className="field-input flex-1"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={pending || orderStatus === currentOrderStatus}
              onClick={() => run(() => updateOrderStatus(orderId, orderStatus))}
              className="btn-dark btn-sm"
            >
              Update
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <label htmlFor="payment-status-select" className="field-label">
            Payment status
          </label>
          <div className="flex gap-2">
            <select
              id="payment-status-select"
              value={paymentStatus}
              onChange={(e) =>
                setPaymentStatus(e.target.value as PaymentStatus)
              }
              className="field-input flex-1"
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={pending || paymentStatus === currentPaymentStatus}
              onClick={() =>
                run(() => updatePaymentStatus(orderId, paymentStatus))
              }
              className="btn-outline btn-sm"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      <Notice state={notice} />
    </section>
  );
}
