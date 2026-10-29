import React, { Suspense } from "react";
import type { Metadata } from "next";
import ShopClient from "./ShopClient";

export const metadata: Metadata = {
  title: "Shop All Products | Eclera Cosmetics",
  description:
    "Explore the complete collection of luxury botanical skincare and clean beauty formulations from Eclera. Dermatologically tested for glowing, healthy skin.",
};

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full bg-[#FAF7F5] min-h-screen py-16 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#5B6240] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ShopClient />
    </Suspense>
  );
}
