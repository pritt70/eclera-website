"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/helper";

export function MarketplaceSection() {
  const [meeshoUrl, setMeeshoUrl] = useState<string>("");

  useEffect(() => {
    async function loadMarketplaceLink() {
      try {
        const res = await api("social", undefined, "GET");
        if (res && res.status && res.data) {
          const url = res.data.meeshoUrl || res.data.links?.meesho || "";
          setMeeshoUrl(url);
        }
      } catch (err) {
        console.error("Failed to load marketplace link:", err);
      }
    }

    loadMarketplaceLink();
  }, []);

  const targetHref = meeshoUrl || "#";

  return (
    <section className="w-full py-8 sm:py-10 bg-[#FAF7F5] border-t border-b border-stone-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Title */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-stone-900 tracking-tight">
          Available on Marketplaces
        </h2>

        {/* Short Description */}
        <p className="mt-2 text-xs sm:text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
          Our products are also available on India&apos;s leading shopping platforms.
        </p>

        {/* 2 Marketplace Images (Meesho & Flipkart) */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-8">
          <a
            href={targetHref}
            target="_blank"
            rel="noreferrer"
            title="Shop Eclera on Meesho"
            className="inline-flex items-center p-1 rounded-lg border border-transparent hover:border-stone-400 transition-colors cursor-pointer"
          >
            <img
              src="/assets/images/meesho.svg"
              alt="Meesho"
              className="h-10 sm:h-12 w-auto max-h-12 object-contain shrink-0"
            />
          </a>

          {/* Flipkart (Display only, non-clickable) */}
          <div className="inline-flex items-center p-1 rounded-lg border border-transparent cursor-default select-none">
            <img
              src="/assets/images/flipkart.svg"
              alt="Flipkart"
              className="h-10 sm:h-12 w-auto max-h-12 object-contain shrink-0"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default MarketplaceSection;
