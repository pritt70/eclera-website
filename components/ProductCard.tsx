"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FiCheck, FiShoppingBag, FiImage } from "react-icons/fi";

export interface ProductImage {
  url?: string;
  publicUrl?: string;
  key?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: ProductImage[];
  category?: {
    _id?: string;
    name: string;
    slug?: string;
  };
  collections?: any[];
  rating?: number;
  reviewsCount?: number;
  description?: string;
  status?: string;
  sortOrder?: number;
  flipkartUrl?: string;
}

export interface ProductCardProps {
  product: any;
  isAdded: boolean;
  onQuickAdd: (product: any, e: React.MouseEvent) => void;
}

export function ProductCard({ product, isAdded, onQuickAdd }: ProductCardProps) {
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
      {/* 1. Large Product Image Container (aspect-[3/4], prominent highlight) */}
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
            /* Empty Image Placeholder */
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

        {/* 2. Standalone Quick Cart Button: Centered inside Image bottom */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            // Check customer login session
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

            onQuickAdd(product, e);
          }}
          className={`absolute bottom-3.5 left-1/2 -translate-x-1/2 z-10 w-[84%] max-w-[210px] py-2.5 px-3 font-semibold text-xs tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer rounded-none shadow-md ${
            isAdded
              ? "bg-[#383d25] text-white"
              : "bg-[#5B6240] text-white hover:bg-[#464c30] active:scale-[0.98]"
          }`}
          title="Quick Add to Cart"
        >
          {isAdded ? (
            <>
              <FiCheck className="w-3.5 h-3.5 text-white" />
              <span>Added to Cart</span>
            </>
          ) : (
            <>
              <FiShoppingBag className="w-3.5 h-3.5 text-white" />
              <span>Quick Add</span>
            </>
          )}
        </button>
      </div>

      {/* 3. Product Info Content (Category -> Title -> Price & MRP -> Stars -> Flipkart) */}
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
            title={product.name}
            className="block text-stone-900 group-hover:text-[#5B6240] transition-colors"
          >
            <h3
              title={product.name}
              className="font-medium text-sm sm:text-base leading-snug line-clamp-2 min-h-[2.75rem]"
            >
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="mt-3 pt-3 border-t border-stone-100 flex flex-col gap-2">
          {/* Product Price & MRP */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-base sm:text-lg font-semibold text-stone-900">
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

          {/* Customer Review Stars & Rating */}
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

export default ProductCard;
