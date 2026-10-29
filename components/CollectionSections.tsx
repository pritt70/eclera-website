"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { FiShoppingBag, FiChevronLeft, FiChevronRight, FiCheck, FiImage, FiArrowRight } from "react-icons/fi";
import { api } from "@/helper";
import { ProductCard } from "./ProductCard";

// Swiper CSS
import "swiper/css";
import "swiper/css/navigation";

interface ProductImage {
  url?: string;
  publicUrl?: string;
  key?: string;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: ProductImage[];
  category?: {
    _id?: string;
    name: string;
    slug: string;
  };
  rating?: number;
  reviewsCount?: number;
  description?: string;
  status?: string;
  flipkartUrl?: string;
}

interface Collection {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  products: Product[];
}

export function CollectionSections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHomeCollections() {
      try {
        setLoading(true);
        // Fetch collections with their products pre-populated from API
        const res = await api("home-collections", undefined, "GET");

        if (res && res.status && Array.isArray(res.data) && res.data.length > 0) {
          setCollections(res.data);
        } else {
          // Fallback: fetch collections and products separately if home-collections not ready
          const [colRes, prodRes] = await Promise.all([
            api("collections", undefined, "GET"),
            api("products", undefined, "GET"),
          ]);

          if (colRes?.status && Array.isArray(colRes.data)) {
            const allProducts: Product[] = Array.isArray(prodRes?.data) ? prodRes.data : [];
            const mapped = colRes.data
              .map((c: any) => {
                const cIdStr = (c._id || "").toString();
                const matched = allProducts.filter((p: any) =>
                  p.collections?.some(
                    (colItem: any) =>
                      (colItem._id || colItem).toString() === cIdStr ||
                      colItem.slug === c.slug
                  )
                );
                return {
                  ...c,
                  products: matched,
                };
              })
              .filter((c: any) => c.products.length > 0);

            setCollections(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load collection sections:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchHomeCollections();
  }, []);

  // Quick Cart Add to Bag Handler
  const handleQuickAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const customer = typeof window !== "undefined" ? localStorage.getItem("eclera_customer") : null;
    if (!customer) {
      try {
        localStorage.setItem("eclera_pending_quick_add", JSON.stringify(product));
      } catch {}
      window.dispatchEvent(
        new CustomEvent("eclera_open_auth_modal", { detail: { mode: "login" } })
      );
      return;
    }

    try {
      const existing = localStorage.getItem("eclera_cart");
      let cart = existing ? JSON.parse(existing) : [];
      if (!Array.isArray(cart)) cart = [];

      const existingIndex = cart.findIndex((item: any) => item._id === product._id);
      const primaryImage =
        product.images?.[0]?.publicUrl || product.images?.[0]?.url || "";

      if (existingIndex > -1) {
        cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
      } else {
        cart.push({
          _id: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          comparePrice: product.comparePrice || product.price,
          image: primaryImage,
          quantity: 1,
        });
      }

      localStorage.setItem("eclera_cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("eclera_cart_updated"));

      // Temporary visual button feedback
      setAddedProductId(product._id);
      setTimeout(() => {
        setAddedProductId(null);
      }, 2000);
    } catch (err) {
      console.error("Error adding to cart:", err);
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-white py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="h-8 w-64 bg-stone-200 animate-pulse rounded-none" />
            <div className="h-1 w-20 bg-[#5B6240]/40 rounded-none" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full mt-10">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-96 bg-stone-200 animate-pulse rounded-none" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (collections.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-white divide-y divide-stone-100">
      {collections.map((collection, colIdx) => (
        <CollectionSliderSection
          key={collection._id || collection.slug || colIdx}
          collection={collection}
          colIndex={colIdx}
          addedProductId={addedProductId}
          onQuickAdd={handleQuickAddToCart}
        />
      ))}
    </div>
  );
}

// Individual Collection Section Component with Swiper Slider
interface CollectionSliderSectionProps {
  collection: Collection;
  colIndex: number;
  addedProductId: string | null;
  onQuickAdd: (product: Product, e: React.MouseEvent) => void;
}

function CollectionSliderSection({
  collection,
  colIndex,
  addedProductId,
  onQuickAdd,
}: CollectionSliderSectionProps) {
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  return (
    <section className="w-full py-12 sm:py-16 md:py-20 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header: Collection Title & Details (Left) + View Collection Button (Right) */}
        <div className="mb-8 sm:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200/70 pb-4 sm:pb-6">
          <div className="flex flex-col items-start text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-stone-900 tracking-tight">
              {collection.name}
            </h2>
            {/* Elegant Primary Color Accent Bar with slight thickness */}
            <div className="w-16 sm:w-20 h-[3.5px] bg-[#5B6240] rounded-none mt-2.5 sm:mt-3" />
            {collection.description && (
              <p className="mt-3 text-xs sm:text-sm md:text-base text-stone-600 max-w-2xl line-clamp-2">
                {collection.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end shrink-0">
            <Link
              href={`/collections/${collection.slug || collection._id}`}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold tracking-wider uppercase bg-[#5B6240] text-white hover:bg-[#474D32] active:scale-[0.98] transition-all duration-200 shadow-2xs rounded-none group cursor-pointer"
            >
              <span>View Collection</span>
              <FiArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Slider Area */}
        <div className="relative group/slider w-full">
          {/* Navigation Arrows (Visible from sm/tablet up, hidden on small mobile to avoid card overlap) */}
          <button
            ref={prevRef}
            aria-label="Previous slide"
            className={`swiper-prev-${colIndex} hidden sm:flex absolute -left-3 sm:-left-4 md:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 bg-white text-stone-900 border border-stone-300 hover:bg-[#5B6240] hover:border-[#5B6240] hover:text-white transition-all duration-200 rounded-none shadow-md items-center justify-center cursor-pointer`}
          >
            <FiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            ref={nextRef}
            aria-label="Next slide"
            className={`swiper-next-${colIndex} hidden sm:flex absolute -right-3 sm:-right-4 md:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 bg-white text-stone-900 border border-stone-300 hover:bg-[#5B6240] hover:border-[#5B6240] hover:text-white transition-all duration-200 rounded-none shadow-md items-center justify-center cursor-pointer`}
          >
            <FiChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <Swiper
            modules={[Navigation, Autoplay]}
            navigation={{
              prevEl: `.swiper-prev-${colIndex}`,
              nextEl: `.swiper-next-${colIndex}`,
            }}
            loop={collection.products.length > 4}
            autoplay={
              collection.products.length > 3
                ? {
                    delay: 4500,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                  }
                : false
            }
            speed={650}
            slidesPerView={1.22}
            spaceBetween={14}
            breakpoints={{
              360: { slidesPerView: 1.25, spaceBetween: 14 },
              440: { slidesPerView: 1.5, spaceBetween: 16 },
              540: { slidesPerView: 1.85, spaceBetween: 18 },
              640: { slidesPerView: 2.25, spaceBetween: 20 },
              768: { slidesPerView: 2.8, spaceBetween: 22 },
              1024: { slidesPerView: 3.4, spaceBetween: 26 },
              1280: { slidesPerView: 4, spaceBetween: 28 },
            }}
            className="w-full !py-2"
          >
            {collection.products.map((product) => (
              <SwiperSlide key={product._id || product.slug} className="!h-auto flex">
                <ProductCard
                  product={product}
                  isAdded={addedProductId === product._id}
                  onQuickAdd={onQuickAdd}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}

