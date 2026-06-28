"use client";
import { useMemo, useState } from "react";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShoppingBag, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckoutButton } from "@/components/app/CheckoutButton";
import { formatPrice } from "@/lib/utils";
import {
  useCartItems,
  useTotalPrice,
  useTotalItems,
} from "@/lib/store/cart-store-provider";
import { useCartStock } from "@/lib/hooks/useCartStock";

interface ShippingAddress {
  name: string;
  line1: string;
  line2: string;
  city: string;
  postcode: string;
  country: string;
}

export function CheckoutClient() {
  const items = useCartItems();
  const totalPrice = useTotalPrice();
  const totalItems = useTotalItems();
  const { stockMap, isLoading, hasStockIssues } = useCartStock(items);

  const [address, setAddress] = useState<ShippingAddress>({
    name: "",
    line1: "",
    line2: "",
    city: "",
    postcode: "",
    country: "",
  });

  const hasRequiredAddressFields = useMemo(
    () =>
      Boolean(
        address.name.trim() &&
        address.line1.trim() && address.line2.trim() &&
        address.city.trim() &&
        address.postcode.trim() &&
        address.country.trim(),
      ),
    [address],
  );

  const updateAddress = (field: keyof ShippingAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-600" />
          <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Your cart is empty
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Add some items to your cart before checking out.
          </p>
          <Button asChild className="mt-8">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Continue Shopping
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Checkout
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Cart Items */}
        <div className="lg:col-span-3">
          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Order Summary ({totalItems} items)
              </h2>
            </div>

            {/* Stock Issues Warning */}
            {hasStockIssues && !isLoading && (
              <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>
                  Some items have stock issues. Please update your cart before
                  proceeding.
                </span>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                <span className="ml-2 text-sm text-zinc-500">
                  Verifying stock...
                </span>
              </div>
            )}

            {/* Items List */}
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {items.map((item) => {
                const stockInfo = stockMap.get(item.productId);
                const hasIssue =
                  stockInfo?.isOutOfStock || stockInfo?.exceedsStock;

                return (
                  <div
                    key={item.productId}
                    className={`flex gap-4 px-6 py-4 ${hasIssue ? "bg-red-50 dark:bg-red-950/20" : ""
                      }`}
                  >
                    {/* Image */}
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                          No image
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                          {item.name}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                          Qty: {item.quantity}
                        </p>
                        {stockInfo?.isOutOfStock && (
                          <p className="mt-1 text-sm font-medium text-red-600">
                            Out of stock
                          </p>
                        )}
                        {stockInfo?.exceedsStock && !stockInfo.isOutOfStock && (
                          <p className="mt-1 text-sm font-medium text-amber-600">
                            Only {stockInfo.currentStock} available
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-sm text-zinc-500">
                          {formatPrice(item.price)} each
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Total & Checkout */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Payment Summary
            </h2>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Subtotal
                </span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Shipping
                </span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  Calculated at checkout
                </span>
              </div>
              <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <div className="flex justify-between text-base font-semibold">
                  <span className="text-zinc-900 dark:text-zinc-100">
                    Total
                  </span>
                  <span className="text-zinc-900 dark:text-zinc-100">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>
            </div>



           

            <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Your order will be placed and a confirmation page will open
            </p>
          </div>
          <div className="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Shipping Address
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="shipping-name">Full Name</Label>
                <Input
                  id="shipping-name"
                  value={address.name}
                  onChange={(event) => updateAddress("name", event.target.value)}
                  placeholder="Full Name"
                />
              </div>
              <div>
                <Label htmlFor="shipping-line1">Address Line 1</Label>
                <Input
                  id="shipping-line1"
                  value={address.line1}
                  onChange={(event) => updateAddress("line1", event.target.value)}
                  placeholder="Street address, P.O. box, company name, c/o"
                />
              </div>
              <div>
                <Label htmlFor="shipping-line2">Address Line 2</Label>
                <Input
                  id="shipping-line2"
                  value={address.line2}
                  onChange={(event) => updateAddress("line2", event.target.value)}
                  placeholder="Apartment, suite, unit, building, floor, etc."
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="shipping-city">City</Label>
                  <Input
                    id="shipping-city"
                    value={address.city}
                    onChange={(event) => updateAddress("city", event.target.value)}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="shipping-postcode">Postcode</Label>
                  <Input
                    id="shipping-postcode"
                    value={address.postcode}
                    onChange={(event) => updateAddress("postcode", event.target.value)}
                    placeholder="Postcode"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="shipping-country">Country</Label>
                <Input
                  id="shipping-country"
                  value={address.country}
                  onChange={(event) => updateAddress("country", event.target.value)}
                  placeholder="Country"
                />
              </div>
            </div>
            {!hasRequiredAddressFields && (
              <p className="mt-3 text-xs text-amber-700 dark:text-amber-200">
                Please complete the required shipping address fields before checkout.
              </p>
            )}
          </div>
           <div className="mt-3">
              <CheckoutButton
                disabled={!hasRequiredAddressFields || hasStockIssues || isLoading}
                address={address}
              />
            </div>
        </div>
      </div>
    </div>
  );
}