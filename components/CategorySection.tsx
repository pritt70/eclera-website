"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

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
  productsCount?: number;
  sortOrder?: number;
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

export function CategorySection() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          api("categories", undefined, "GET"),
          api("products", undefined, "GET"),
        ]);

        if (isMounted) {
          if (catRes && catRes.status && Array.isArray(catRes.data) && catRes.data.length > 0) {
            setCategories(catRes.data);
          } else {
            setCategories([]);
          }

          if (prodRes && prodRes.status && Array.isArray(prodRes.data)) {
            setProducts(prodRes.data);
          } else {
            setProducts([]);
          }
        }
      } catch (err) {
        console.error("Failed to load category section data:", err);
        if (isMounted) {
          setCategories([]);
          setProducts([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute live product counts per category
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

  // Loading skeleton placeholder
  if (loading) {
    return (
      <section className="w-full bg-white border-b border-stone-100 py-8 sm:py-12 md:py-14">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col items-center gap-3 shrink-0 animate-pulse">
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40 rounded-full bg-stone-100" />
                <div className="w-20 h-4 bg-stone-100 rounded-sm" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // If no categories in admin panel, do not render section
  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-white border-b border-stone-100 py-8 sm:py-12 md:py-14">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-10 flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-stone-900 tracking-tight">
            Explore Our Categories
          </h2>
          {/* Elegant Primary Color Accent Bar with slight thickness */}
          <div className="w-16 sm:w-20 h-[3.5px] bg-[#5B6240] rounded-full mt-3 sm:mt-3.5" />
        </div>

        {/* Circular Category Slider */}
        <div className="w-full">
          <Swiper
            modules={[Autoplay]}
            autoplay={{
              delay: 2400,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            loop={categories.length > 4}
            speed={750}
            slidesPerView={2.4}
            spaceBetween={14}
            breakpoints={{
              360: { slidesPerView: 2.6, spaceBetween: 14 },
              420: { slidesPerView: 3.1, spaceBetween: 16 },
              540: { slidesPerView: 3.6, spaceBetween: 18 },
              640: { slidesPerView: 4.2, spaceBetween: 20 },
              768: { slidesPerView: 4.8, spaceBetween: 24 },
              1024: { slidesPerView: 5.4, spaceBetween: 28 },
              1280: { slidesPerView: 6, spaceBetween: 32 },
              1440: { slidesPerView: 6.2, spaceBetween: 36 },
            }}
            className="w-full !py-3"
          >
            {categories.map((cat) => {
              const imageUrl = cat.image?.publicUrl || cat.image?.url || "";
              const count = productCountMap[cat._id] || productCountMap[cat.slug] || cat.productsCount || 0;
              const isEmpty = count === 0;

              const InnerContent = (
                <>
                  {/* Full Rounded Circular Image */}
                  <div
                    className={`relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40 rounded-full p-1.5 bg-white border-2 transition-colors duration-300 ${
                      !isEmpty
                        ? "border-stone-200/80 group-hover:border-[#5B6240] shadow-xs group-hover:shadow-md"
                        : "border-stone-200/60 shadow-2xs opacity-85"
                    }`}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#F9F9EB] flex items-center justify-center relative">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={cat.name}
                          className={`w-full h-full object-cover object-center transition-transform duration-500 ease-out ${
                            !isEmpty ? "group-hover:scale-115" : "grayscale-15"
                          }`}
                          loading="lazy"
                        />
                      ) : (
                        <span
                          className={`text-xl sm:text-2xl font-semibold uppercase tracking-wider transition-transform duration-300 ${
                            !isEmpty
                              ? "text-[#5B6240]/80 group-hover:scale-110"
                              : "text-stone-400"
                          }`}
                        >
                          {cat.name.slice(0, 2)}
                        </span>
                      )}

                      {/* Soon badge overlay inside circular image for empty categories */}
                      {isEmpty && (
                        <div className="absolute inset-x-0 bottom-0 py-1 bg-stone-900/75 backdrop-blur-2xs flex items-center justify-center">
                          <span className="text-[9px] sm:text-[10px] font-semibold text-white uppercase tracking-wider">
                            Soon
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category Name */}
                  <span
                    className={`mt-3 sm:mt-3.5 text-xs sm:text-sm md:text-base font-semibold line-clamp-2 max-w-[120px] sm:max-w-[140px] md:max-w-[160px] leading-snug transition-colors ${
                      !isEmpty
                        ? "text-stone-800 group-hover:text-[#5B6240]"
                        : "text-stone-600"
                    }`}
                  >
                    {cat.name}
                  </span>
                </>
              );

              return (
                <SwiperSlide key={cat._id || cat.slug}>
                  {isEmpty ? (
                    /* Disabled / Non-clickable Category item */
                    <div
                      className="group flex flex-col items-center text-center cursor-default select-none py-2"
                      title={`${cat.name} - Coming Soon`}
                    >
                      {InnerContent}
                    </div>
                  ) : (
                    /* Active Link to Category */
                    <Link
                      href={`/category/${cat.slug}`}
                      className="group flex flex-col items-center text-center cursor-pointer select-none py-2"
                    >
                      {InnerContent}
                    </Link>
                  )}
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
