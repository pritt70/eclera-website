"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { FiArrowRight, FiPackage, FiChevronRight } from "react-icons/fi";
import { api } from "@/helper";

export interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: {
    url?: string;
    publicUrl?: string;
    key?: string;
  };
  sortOrder?: number;
  productsCount?: number;
}

export interface ProductItem {
  _id: string;
  name: string;
  slug: string;
  category?: {
    _id?: string;
    name?: string;
    slug?: string;
  };
}

export default function CategoriesClient() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const [catRes, prodRes] = await Promise.all([
          api("categories", undefined, "GET"),
          api("products", undefined, "GET"),
        ]);

        if (isMounted) {
          if (catRes?.status && Array.isArray(catRes.data)) {
            setCategories(catRes.data);
          } else {
            setCategories([]);
          }

          if (prodRes?.status && Array.isArray(prodRes.data)) {
            setProducts(prodRes.data);
          } else {
            setProducts([]);
          }
        }
      } catch (err) {
        console.error("Failed to load categories page data:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute live product count per category
  const productCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      const catId = p.category?._id || (typeof p.category === "string" ? p.category : null);
      const catSlug = p.category?.slug;
      if (catId) {
        map[catId] = (map[catId] || 0) + 1;
      }
      if (catSlug) {
        map[catSlug] = (map[catSlug] || 0) + 1;
      }
    });
    return map;
  }, [products]);

  // Sorted categories by sortOrder then name
  const sortedCategories = useMemo(() => {
    return [...categories].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)
    );
  }, [categories]);

  return (
    <div className="w-full bg-[#FAF7F5] min-h-screen pb-16 sm:pb-24">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-stone-500 font-medium">
            <Link href="/" className="hover:text-[#5B6240] transition-colors">
              Home
            </Link>
            <FiChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="text-stone-900 font-semibold uppercase tracking-wider text-[11px]">
              Categories
            </span>
          </nav>
        </div>
      </div>

      {/* Top Header Section: Only Title */}
      <section className="bg-white border-b border-stone-200 py-10 sm:py-14">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-stone-900 tracking-tight">
            Explore All Categories
          </h1>
          <div className="w-16 sm:w-20 h-[3.5px] bg-[#5B6240] rounded-none mt-3.5 sm:mt-4" />
        </div>
      </section>

      {/* Direct Categories List Grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {loading ? (
          /* Loading Skeletons */
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white border border-stone-200 flex flex-col p-4 animate-pulse space-y-4"
              >
                <div className="aspect-square w-full bg-stone-100" />
                <div className="space-y-2">
                  <div className="w-3/4 h-5 bg-stone-100" />
                  <div className="w-1/2 h-3.5 bg-stone-100" />
                </div>
                <div className="w-full h-8 bg-stone-100" />
              </div>
            ))}
          </div>
        ) : sortedCategories.length === 0 ? (
          /* Empty State */
          <div className="bg-white border border-stone-200 py-16 px-6 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-[#F1F3EC] rounded-full flex items-center justify-center text-[#5B6240] mb-4">
              <FiPackage className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900 mb-1">
              No Categories Available
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 max-w-sm">
              Categories will appear here once added in the admin panel.
            </p>
          </div>
        ) : (
          /* Category Cards Grid */
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {sortedCategories.map((cat) => {
              const imageUrl = cat.image?.publicUrl || cat.image?.url || "";
              const count = productCountMap[cat._id] || productCountMap[cat.slug] || cat.productsCount || 0;
              const isEmpty = count === 0;
              const hasDescription = Boolean(cat.description && cat.description.trim());

              const CardContent = (
                <>
                  {/* Category Image Area */}
                  <div className="relative aspect-square w-full bg-[#FAF9EB] overflow-hidden flex items-center justify-center">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={cat.name}
                        className={`w-full h-full object-cover object-center transition-transform duration-500 ease-out ${
                          !isEmpty ? "group-hover:scale-108" : "opacity-90"
                        }`}
                        loading="lazy"
                      />
                    ) : (
                      /* Minimal botanical fallback */
                      <div className="flex flex-col items-center justify-center p-6 text-center select-none">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-[#D5D9C8] bg-white flex items-center justify-center mb-2 shadow-2xs">
                          <span
                            className={`text-xl sm:text-2xl font-bold uppercase tracking-wider transition-transform duration-300 ${
                              !isEmpty
                                ? "text-[#5B6240] group-hover:scale-110"
                                : "text-stone-400"
                            }`}
                          >
                            {cat.name.slice(0, 2)}
                          </span>
                        </div>
                        <span className="text-[11px] text-stone-400 font-medium uppercase tracking-widest">
                          Eclera
                        </span>
                      </div>
                    )}

                    {/* Product count badge only when category has products */}
                    {!isEmpty && (
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs border border-stone-200/80 px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold text-stone-800 tracking-wider uppercase shadow-2xs">
                        {count} {count === 1 ? "Product" : "Products"}
                      </div>
                    )}
                  </div>

                  {/* Category Details Area */}
                  <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between bg-white border-t border-stone-100">
                    <div>
                      <h2
                        className={`text-sm sm:text-base font-bold transition-colors line-clamp-1 ${
                          !isEmpty
                            ? "text-stone-900 group-hover:text-[#5B6240]"
                            : "text-stone-700"
                        }`}
                      >
                        {cat.name}
                      </h2>

                      {/* Description ONLY if present in Admin Panel; otherwise hidden completely */}
                      {hasDescription ? (
                        <p className="mt-1 text-[11px] sm:text-xs text-stone-500 line-clamp-2 leading-relaxed">
                          {cat.description!.trim()}
                        </p>
                      ) : null}
                    </div>

                    {/* Bottom Action Area */}
                    <div className="mt-4 pt-3 border-t border-stone-100">
                      {isEmpty ? (
                        <div className="flex items-center text-xs font-semibold text-amber-700">
                          <span className="uppercase tracking-wider text-[11px]">
                            Coming Soon
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs font-semibold text-[#5B6240] group-hover:text-[#474D32]">
                          <span className="uppercase tracking-wider text-[11px]">
                            View Category
                          </span>
                          <FiArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );

              return isEmpty ? (
                /* Non-clickable Card for Empty Category */
                <div
                  key={cat._id || cat.slug}
                  className="group flex flex-col bg-white border border-stone-200/80 shadow-2xs overflow-hidden cursor-default select-none"
                  title={`${cat.name} - Coming Soon`}
                >
                  {CardContent}
                </div>
              ) : (
                /* Active Clickable Card for Category with Products */
                <Link
                  key={cat._id || cat.slug}
                  href={`/category/${cat.slug}`}
                  className="group flex flex-col bg-white border border-stone-200 hover:border-[#5B6240] transition-all duration-300 shadow-2xs hover:shadow-lg overflow-hidden cursor-pointer"
                >
                  {CardContent}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
