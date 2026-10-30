"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/helper";

export default function PoliciesIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Fetch live policies from the database
    api("policies", undefined, "GET")
      .then((res) => {
        if (res && res.status && Array.isArray(res.data) && res.data.length > 0) {
          const firstSlug = res.data[0].slug;
          router.replace(`/policies/${firstSlug}`);
        } else {
          // If no policies are added in admin panel, redirect to home
          router.replace("/");
        }
      })
      .catch(() => {
        router.replace("/");
      });
  }, [router]);

  return (
    <div className="w-full bg-[#FAF7F5] min-h-[60vh] flex items-center justify-center py-20 px-4">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-[#5B6240]" />
        <p className="text-xs text-stone-500 font-medium">Loading store policies...</p>
      </div>
    </div>
  );
}
