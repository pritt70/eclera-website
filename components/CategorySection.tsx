"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

import { api } from "@/helper";

export interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  image?: {
    url?: string;
    publicUrl?: string;
    key?: string;
  };
  productsCount?: number;
  sortOrder?: number;
}

export function CategorySection() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const res = await api("categories", undefined, "GET");
        if (isMounted && res && res.status && Array.isArray(res.data) && res.data.length > 0) {
          setCategories(res.data);
        } else if (isMounted) {
          setCategories([]);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
        if (isMounted) setCategories([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

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

        {/* Circular Category Slider (Continuous Autoscroll, Highlighted Prominent Badges) */}
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

              return (
                <SwiperSlide key={cat._id || cat.slug}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="group flex flex-col items-center text-center cursor-pointer select-none py-2"
                  >
                    {/* Full Rounded Circular Image - Stationary outer badge with hover border, ONLY inner image scales */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40 rounded-full p-1.5 bg-white border-2 border-stone-200/80 group-hover:border-[#5B6240] shadow-xs group-hover:shadow-md transition-colors duration-300">
                      <div className="w-full h-full rounded-full overflow-hidden bg-[#F9F9EB] flex items-center justify-center">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={cat.name}
                            className="w-full h-full object-cover object-center group-hover:scale-115 transition-transform duration-500 ease-out"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-xl sm:text-2xl font-bold text-[#5B6240]/80 uppercase tracking-wider group-hover:scale-110 transition-transform duration-300">
                            {cat.name.slice(0, 2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Category Name - Enhanced font size & visibility */}
                    <span className="mt-3 sm:mt-3.5 text-xs sm:text-sm md:text-base font-semibold text-stone-800 line-clamp-2 max-w-[120px] sm:max-w-[140px] md:max-w-[160px] group-hover:text-[#5B6240] transition-colors leading-snug">
                      {cat.name}
                    </span>
                  </Link>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
