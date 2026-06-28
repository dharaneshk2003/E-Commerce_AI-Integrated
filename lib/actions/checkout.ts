"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { client, writeClient } from "../../../studio-e_commerce-ai/lib/client";
import { PRODUCTS_BY_IDS_QUERY } from "../../../studio-e_commerce-ai/queries/products";

// Types
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface ShippingAddress {
  name: string;
  line1: string;
  line2: string;
  city: string;
  postcode: string;
  country: string;
}

interface CheckoutResult {
  success: boolean;
  url?: string;
  error?: string;
}

const generateOrderNumber = () =>
  `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

/**
 * Creates a Sanity order from cart items
 * Validates stock and prices against Sanity before creating the order
 */
export async function createCheckoutSession(
  items: CartItem[],
  address?: ShippingAddress,
): Promise<CheckoutResult> {
  try {
    // 1. Verify user is authenticated
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return { success: false, error: "Please sign in to checkout" };
    }

    // 2. Validate cart is not empty
    if (!items || items.length === 0) {
      return { success: false, error: "Your cart is empty" };
    }

    if (
      !address ||
      !address.name.trim() ||
      !address.line1.trim() ||
      !address.city.trim() ||
      !address.postcode.trim() ||
      !address.country.trim()
    ) {
      return {
        success: false,
        error: "A complete shipping address is required to place an order.",
      };
    }

    // 3. Fetch current product data from Sanity to validate prices/stock
    const productIds = items.map((item) => item.productId);
    const products = await client.fetch(PRODUCTS_BY_IDS_QUERY, {
      ids: productIds,
    });

    // 4. Validate each item
    const validationErrors: string[] = [];
    const validatedItems: {
      product: (typeof products)[number];
      quantity: number;
    }[] = [];

    for (const item of items) {
      const product = products.find(
        (p: { _id: string }) => p._id === item.productId
      );

      if (!product) {
        validationErrors.push(`Product "${item.name}" is no longer available`);
        continue;
      }

      if ((product.stock ?? 0) === 0) {
        validationErrors.push(`"${product.name}" is out of stock`);
        continue;
      }

      if (item.quantity > (product.stock ?? 0)) {
        validationErrors.push(
          `Only ${product.stock} of "${product.name}" available`
        );
        continue;
      }

      validatedItems.push({ product, quantity: item.quantity });
    }

    if (validationErrors.length > 0) {
      return { success: false, error: validationErrors.join(". ") };
    }

    const userEmail = user.emailAddresses[0]?.emailAddress ?? "";
    const userName =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || userEmail;

    if (!userEmail) {
      return {
        success: false,
        error: "A verified email is required to place an order.",
      };
    }

    const customerId = `customer_${userId}`;
    const customer = await writeClient.createIfNotExists({
      _id: customerId,
      _type: "customer",
      email: userEmail,
      name: userName,
      clerkUserId: userId,
      orderCount: 0,
      createdAt: new Date().toISOString(),
    });

    const order = await writeClient.create({
      _type: "order",
      orderNumber: generateOrderNumber(),
      items: validatedItems.map(({ product, quantity }) => ({
        _type: "object",
        product: {
          _type: "reference",
          _ref: product._id,
        },
        quantity,
        priceAtPurchase: product.price ?? 0,
      })),
      total: validatedItems.reduce(
        (sum, item) => sum + (item.product.price ?? 0) * item.quantity,
        0,
      ),
      status: "paid",
      customer: {
        _type: "reference",
        _ref: customer._id,
      },
      clerkUserId: userId,
      email: userEmail,
      paymentMethod: "cod",
      paymentStatus: "paid",
      address: {
        _type: "address",
        name: address.name,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        postcode: address.postcode,
        country: address.country,
      },
      createdAt: new Date().toISOString(),
    });

    await writeClient.patch(customer._id).set({
      email: userEmail,
      name: userName,
      clerkUserId: userId,
    }).inc({ orderCount: 1 }).commit();

    return {
      success: true,
      url: `/checkout/success?orderId=${order._id}`,
    };
  } catch (error) {
    console.error("Checkout error:", error);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}

