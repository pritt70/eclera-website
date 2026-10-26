"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { FiShoppingBag, FiChevronLeft, FiChevronRight, FiCheck, FiImage } from "react-icons/fi";
import { api } from "@/helper";

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
        {/* Section Header: Collection Name as Title, Semi-bold, Primary Accent Bar */}
        <div className="text-center mb-8 sm:mb-12 flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-stone-900 tracking-tight">
            {collection.name}
          </h2>
          {/* Elegant Primary Color Accent Bar with slight thickness */}
          <div className="w-16 sm:w-20 h-[3.5px] bg-[#5B6240] rounded-none mt-3 sm:mt-3.5" />
          {collection.description && (
            <p className="mt-3.5 text-xs sm:text-sm md:text-base text-stone-600 max-w-2xl line-clamp-2 px-2">
              {collection.description}
            </p>
          )}
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

// Product Card Component ("Cart")
// Strictly NO border-radius (rounded-none), Big size highlighting product,
// Fixed Real Button in Primary Color (#5B6240) with margin from sides,
// Empty Image shows React Icon FiImage without text,
// Product Title -> Price & MRP -> Customer Review Stars
interface ProductCardProps {
  product: Product;
  isAdded: boolean;
  onQuickAdd: (product: Product, e: React.MouseEvent) => void;
}

function ProductCard({ product, isAdded, onQuickAdd }: ProductCardProps) {
  // Manage customer review rating & reviews count (fallback if not in API)
  const seed = product.name ? product.name.charCodeAt(0) + product.name.length : 50;
  const rating = product.rating || Number((4.6 + ((seed % 4) * 0.1)).toFixed(1));
  const reviewsCount = product.reviewsCount || 24 + ((seed * 7) % 85);

  const [imgError, setImgError] = useState(false);
  const [hoverImgError, setHoverImgError] = useState(false);

  const rawPrimary = product.images?.[0]?.publicUrl || product.images?.[0]?.url || "";
  const primaryImage = rawPrimary && rawPrimary.trim() !== "" ? rawPrimary.trim() : "";

  const rawHover = product.images?.[1]?.publicUrl || product.images?.[1]?.url || "";
  const hoverImage = rawHover && rawHover.trim() !== "" ? rawHover.trim() : "";

  const hasValidImage = Boolean(primaryImage) && !imgError;

  const hasDiscount =
    product.comparePrice && product.comparePrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        (((product.comparePrice || 0) - product.price) /
          (product.comparePrice || 1)) *
          100
      )
    : 0;

  return (
    <div className="group flex flex-col w-full h-full bg-white border border-stone-200/90 rounded-none transition-all duration-300 hover:border-[#5B6240] hover:shadow-lg">
      {/* 1. Large Product Image Container (rounded-none, prominent highlight) */}
      <div className="relative w-full aspect-[3/4] bg-[#F9F9EB]/80 overflow-hidden rounded-none flex items-center justify-center">
        <Link
          href={`/product/${product.slug}`}
          className="relative w-full h-full block"
        >
          {hasValidImage ? (
            <>
              {/* Primary Image */}
              <img
                src={primaryImage}
                alt={product.name}
                loading="lazy"
                onError={() => setImgError(true)}
                className={`w-full h-full object-cover object-center transition-all duration-700 ease-out rounded-none ${
                  hoverImage && hoverImage !== primaryImage && !hoverImgError
                    ? "group-hover:opacity-0"
                    : "group-hover:scale-108"
                }`}
              />
              {/* Secondary Image on Hover if available */}
              {hoverImage && hoverImage !== primaryImage && !hoverImgError && (
                <img
                  src={hoverImage}
                  alt={`${product.name} view`}
                  loading="lazy"
                  onError={() => setHoverImgError(true)}
                  className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 group-hover:scale-108 transition-all duration-700 ease-out rounded-none"
                />
              )}
            </>
          ) : (
            /* Empty Image Placeholder: Big React Icon FiImage without text */
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#F9F9EB]/80 text-stone-300">
              <FiImage className="w-16 h-16 sm:w-20 sm:h-20 text-[#5B6240]/30 stroke-[1.2]" />
            </div>
          )}
        </Link>

        {/* Discount Badge on Top Left (rounded-none) */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 z-10 bg-[#5B6240] text-white text-[11px] font-semibold tracking-wider px-2.5 py-1 uppercase rounded-none shadow-xs">
            {discountPercent}% OFF
          </div>
        )}

        {/* 2. Real STANDALONE Quick Cart Button: Centered, Default Primary Color (#5B6240), White Text, Clear Margins */}
        <button
          type="button"
          onClick={(e) => onQuickAdd(product, e)}
          className={`absolute bottom-3.5 left-1/2 -translate-x-1/2 z-10 w-[84%] max-w-[210px] py-2.5 px-3 font-semibold text-xs sm:text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer rounded-none shadow-md ${
            isAdded
              ? "bg-[#383d25] text-white"
              : "bg-[#5B6240] text-white hover:bg-[#464c30] active:scale-[0.98]"
          }`}
          title="Quick Add to Cart"
        >
          {isAdded ? (
            <>
              <FiCheck className="w-3.5 h-3.5 text-white" />
              <span>ADDED TO BAG</span>
            </>
          ) : (
            <>
              <FiShoppingBag className="w-3.5 h-3.5 text-white" />
              <span>QUICK ADD</span>
            </>
          )}
        </button>
      </div>

      {/* 3. Product Info Content (Title -> Price & MRP -> Customer Review Stars) */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between bg-white rounded-none">
        <div>
          {/* Category Tag */}
          {product.category?.name && (
            <span className="text-[11px] font-semibold text-[#5B6240] uppercase tracking-wider block mb-1">
              {product.category.name}
            </span>
          )}

          {/* Product Title (Consistent 2-line height for aligned cards) */}
          <Link
            href={`/product/${product.slug}`}
            className="block text-stone-900 group-hover:text-[#5B6240] transition-colors"
          >
            <h3 className="font-medium text-sm sm:text-base leading-snug line-clamp-2 min-h-[2.75rem]">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="mt-3 pt-3 border-t border-stone-100 flex flex-col gap-2">
          {/* Product Price & MRP */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-base sm:text-lg font-bold text-stone-900">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
              <span className="text-xs sm:text-sm text-stone-400 line-through">
                ₹{product.comparePrice?.toLocaleString("en-IN")}
              </span>
            )}
            {hasDiscount && (
              <span className="text-[11px] sm:text-xs font-semibold text-[#5B6240]">
                Save ₹{((product.comparePrice || 0) - product.price).toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* Customer Review Stars & Rating (Managed key if not in API) */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="flex items-center text-amber-500 text-sm">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFull = rating >= star;
                const isHalf = rating >= star - 0.5 && rating < star;
                return (
                  <span key={star} className="inline-block">
                    {isFull ? (
                      <svg
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ) : isHalf ? (
                      <svg
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400"
                        viewBox="0 0 20 20"
                      >
                        <defs>
                          <linearGradient id={`half-${product._id}-${star}`}>
                            <stop offset="50%" stopColor="#fbbf24" />
                            <stop offset="50%" stopColor="#e5e7eb" />
                          </linearGradient>
                        </defs>
                        <path
                          fill={`url(#half-${product._id}-${star})`}
                          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-stone-200 text-stone-200"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    )}
                  </span>
                );
              })}
            </div>
            <span className="text-xs font-semibold text-stone-800 ml-0.5">
              {rating}
            </span>
            <span className="text-xs text-stone-400">
              ({reviewsCount})
            </span>
          </div>

          {/* Flipkart Marketplace Link Button */}
          {product.flipkartUrl && (
            <div className="mt-2.5 pt-2 border-t border-stone-100">
              <a
                href={product.flipkartUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-full py-1.5 px-2 bg-white hover:bg-stone-50 border border-stone-200 hover:border-[#2874F0] flex items-center justify-center gap-1.5 transition-colors shadow-2xs group/fk cursor-pointer"
                title="Buy on Flipkart"
              >
                <span className="text-[11px] font-medium text-stone-600 group-hover/fk:text-[#2874F0]">
                  Buy on
                </span>
                <img
                  src="/assets/images/flipkart.svg"
                  alt="Flipkart"
                  className="h-4 sm:h-4.5 w-auto object-contain shrink-0"
                />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
