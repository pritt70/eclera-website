import React, { Suspense } from "react";
import AccountClient from "./AccountClient";

export const metadata = {
  title: "My Account & Saved Address | Eclera Cosmetics",
  description: "Manage your delivery addresses and account details.",
};

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full bg-[#FAF7F5] min-h-screen py-24 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#5B6240] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AccountClient />
    </Suspense>
  );
}
