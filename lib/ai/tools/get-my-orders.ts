import { tool } from "ai";
import { z } from "zod";
import { sanityFetch } from "../../../studio-e_commerce-ai/lib/live.ts";
import { ORDERS_BY_USER_QUERY } from "../../../studio-e_commerce-ai/queries/orders.ts";
import {
  ORDER_STATUS_VALUES,
  getOrderStatusEmoji,
} from "@/lib/constants/orderStatus";
import { formatPrice } from "@/lib/utils";

const getMyOrdersSchema = z.object({
  status: z
    .enum(ORDER_STATUS_VALUES)
    .optional()
    .describe("Filter orders by status (omit to show all orders)"),
});

export interface OrderSummary {
  id: string;
  orderNumber: string | null;
  total: number | null;
  totalFormatted: string | null;
  status: string | null;
  statusDisplay: string;
  itemCount: number;
  itemNames: string[];
  itemImages: string[];
  createdAt: string | null;
  orderUrl: string;
}

export interface GetMyOrdersResult {
  found: boolean;
  message: string;
  orders: OrderSummary[];
  totalOrders: number;
  isAuthenticated: boolean;
  error?: string;
}

type OrderQueryResult = {
  _id: string;
  orderNumber?: string | null;
  total?: number | null;
  status?: string | null;
  createdAt?: string | null;
  itemCount?: number | null;
  itemNames?: (string | null)[] | null;
  itemImages?: (string | null)[] | null;
};

export function createGetMyOrdersTool(userId: string | null) {
  if (!userId) {
    return null;
  }

  return tool({
    description:
      "Get the current user's orders. Can optionally filter by order status. Only works for authenticated users.",
    inputSchema: getMyOrdersSchema,
    execute: async ({ status }) => {
      try {
        const { data: orders } = await sanityFetch({
          query: ORDERS_BY_USER_QUERY,
          params: { clerkUserId: userId },
        });

        let filteredOrders = (orders ?? []) as OrderQueryResult[];
        if (status) {
          filteredOrders = filteredOrders.filter(
            (order) => order.status === status,
          );
        }

        if (filteredOrders.length === 0) {
          return {
            found: false,
            message: status
              ? `No orders found with status "${status}".`
              : "You don't have any orders yet.",
            orders: [],
            totalOrders: 0,
            isAuthenticated: true,
          } satisfies GetMyOrdersResult;
        }

        const formattedOrders: OrderSummary[] = filteredOrders.map((order) => ({
          id: order._id,
          orderNumber: order.orderNumber ?? null,
          total: order.total ?? null,
          totalFormatted: order.total ? formatPrice(order.total) : null,
          status: order.status ?? null,
          statusDisplay: getOrderStatusEmoji(order.status),
          itemCount: order.itemCount ?? 0,
          itemNames: (order.itemNames ?? []).filter(
            (name): name is string => name !== null,
          ),
          itemImages: (order.itemImages ?? []).filter(
            (url): url is string => url !== null,
          ),
          createdAt: order.createdAt ?? null,
          orderUrl: `/orders/${order._id}`,
        }));

        return {
          found: true,
          message: `Found ${filteredOrders.length} order${filteredOrders.length === 1 ? "" : "s"}.`,
          orders: formattedOrders,
          totalOrders: filteredOrders.length,
          isAuthenticated: true,
        } satisfies GetMyOrdersResult;
      } catch (error) {
        console.error("[GetMyOrders] Error:", error);
        return {
          found: false,
          message: "An error occurred while fetching your orders.",
          orders: [],
          totalOrders: 0,
          isAuthenticated: true,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  });
}
