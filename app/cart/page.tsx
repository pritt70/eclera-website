import React, { Suspense } from "react";
import CartClient from "./CartClient";

export const metadata = {
  title: "Shopping Bag & Checkout | Eclera Cosmetics",
  description: "Complete your order with secure UPI QR payment and exclusive discounts.",
};

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-gray-600">Loading your shopping bag...</p>
          </div>
        </div>
      }
    >
      <CartClient />
    </Suspense>
  );
}
