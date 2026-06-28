import { redirect } from "next/navigation";
import { SuccessClient } from "./SuccessClient";
import { client } from "../../../studio-e_commerce-ai/lib/client.ts";
import { ORDER_BY_ID_QUERY } from "../../../studio-e_commerce-ai/queries/orders.ts";

export const metadata = {
  title: "Order Confirmed | Furniture Shop",
  description: "Your order has been placed successfully",
};

interface SuccessPageProps {
  searchParams: Promise<{ orderId?: string }>;
}

async function getCheckoutSession(orderId: string) {
  const order = await client.fetch(ORDER_BY_ID_QUERY, { id: orderId });

  if (!order) {
    return { success: false, error: "Order not found" };
  }

  return {
    success: true,
    session: {
      id: order._id,
      customerEmail: order.email,
      customerName: order.address?.name || order.email || null,
      amountTotal: (order.total ?? 0) * 100,
      paymentStatus: order.paymentStatus ?? "pending",
      shippingAddress: order.address
        ? {
            line1: order.address.line1 || null,
            line2: order.address.line2 || null,
            city: order.address.city || null,
            state: order.address.state || null,
            postal_code: order.address.postcode || null,
            country: order.address.country || null,
          }
        : null,
      lineItems: (order.items ?? []).map((item: any) => ({
        name: item.product?.name ?? "Product",
        quantity: item.quantity ?? 1,
        amount: (item.priceAtPurchase ?? 0) * 100,
      })),
    },
  };
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const orderId = params.orderId;

  if (!orderId) {
    redirect("/");
  }

  const result = await getCheckoutSession(orderId);

  if (!result.success || !result.session) {
    redirect("/");
  }

  return <SuccessClient session={result.session} />;
}