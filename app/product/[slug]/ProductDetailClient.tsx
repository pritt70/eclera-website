"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  FiChevronRight,
  FiChevronDown,
  FiShoppingBag,
  FiCheck,
  FiStar,
  FiShield,
  FiTruck,
  FiRefreshCw,
  FiPlus,
  FiMinus,
  FiImage,
  FiMessageSquare,
  FiGlobe,
  FiEdit3,
} from "react-icons/fi";
import { api } from "@/helper";

interface ProductImage {
  url?: string;
  publicUrl?: string;
  key?: string;
}

interface ProductSpecificationOption {
  _id: string;
  name: string;
  value?: string;
}

interface ProductSpecificationItem {
  specification?: {
    _id: string;
    name: string;
    displayName?: string;
    is_variant?: boolean;
    is_veriant?: boolean;
  };
  options?: ProductSpecificationOption[];
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  barcode?: string;
  price: number;
  comparePrice?: number;
  stock: number;
  trackStock?: boolean;
  images: ProductImage[];
  category?: {
    _id?: string;
    name: string;
    slug: string;
  };
  collections?: {
    _id?: string;
    name: string;
    slug: string;
  }[];
  description?: string;
  specifications?: ProductSpecificationItem[];
  rating?: number;
  reviewsCount?: number;
}

interface ReviewItem {
  _id: string;
  name: string;
  country: string;
  rating: number;
  message: string;
  createdAt: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  breakdown: Record<string, number>;
}

export default function ProductDetailClient({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  // Accordion state: Product Description is open by default as requested; specifications & reviews collapsed
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    description: true,
    specifications: false,
    reviews: false,
  });

  const toggleAccordion = (sectionKey: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  // Reviews state - strictly database-driven, 0 initial reviews if none in db
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    breakdown: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
  });
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Review Form state - strictly blank by default (NO hardcoded/default name or country)
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [formName, setFormName] = useState("");
  const [formCountry, setFormCountry] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState("");
  const [reviewErrorMessage, setReviewErrorMessage] = useState("");

  // Auto-fill name & country ONLY if customer is logged in and has profile data; otherwise strictly blank
  useEffect(() => {
    try {
      const customerSaved = localStorage.getItem("eclera_customer");
      if (customerSaved) {
        const customer = JSON.parse(customerSaved);
        if (customer) {
          const name =
            customer.fullName ||
            (customer.firstName
              ? `${customer.firstName} ${customer.lastName || ""}`.trim()
              : "");
          setFormName(name || "");
          setFormCountry(customer.country || "");
          return;
        }
      }
      setFormName("");
      setFormCountry("");
    } catch {
      setFormName("");
      setFormCountry("");
    }
  }, [showReviewForm]);

  // Load product details
  useEffect(() => {
    let isMounted = true;

    async function loadProductData() {
      try {
        setLoading(true);
        const res = await api(`product/${slug}`, undefined, "GET");
        if (isMounted && res?.status && res.data) {
          setProduct(res.data);
        } else if (isMounted) {
          setProduct(null);
        }
      } catch (err) {
        console.error("Failed to load product:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProductData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Load reviews strictly from database for this specific product
  useEffect(() => {
    let isMounted = true;

    async function loadReviews() {
      try {
        setReviewsLoading(true);
        const res = await api(`reviews/${slug}`, undefined, "GET");
        if (isMounted && res?.status && res.data) {
          setReviews(res.data.reviews || []);
          if (res.data.stats) {
            setReviewStats(res.data.stats);
          }
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        if (isMounted) setReviewsLoading(false);
      }
    }

    if (slug) {
      loadReviews();
    }

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Stock status calculation in 3 distinct colors (Stone/Black -> Amber/Warning -> Red/Critical)
  const stockInfo = useMemo(() => {
    const stock = product?.stock ?? 0;
    if (stock <= 0) {
      return {
        stage: "out",
        label: "Out of Stock",
        textColor: "text-red-700",
        dotColor: "bg-red-600",
        barColor: "bg-red-600",
        percent: 0,
        subtext: "Currently unavailable. Check back soon for restock.",
      };
    } else if (stock <= 5) {
      // Stage 3: Critical Low Stock -> Red Color
      return {
        stage: "critical",
        label: `🔥 Critical Low Stock - Only ${stock} ${stock === 1 ? "unit" : "units"} left!`,
        textColor: "text-red-700",
        dotColor: "bg-red-600 animate-pulse",
        barColor: "bg-red-600",
        percent: Math.min(100, Math.max(10, (stock / 20) * 100)),
        subtext: "Order now before stock completely sells out.",
      };
    } else if (stock <= 20) {
      // Stage 2: Warning Stock -> Amber/Warning Color
      return {
        stage: "warning",
        label: `⚠ Limited Stock! Only ${stock} units left in stock`,
        textColor: "text-amber-800",
        dotColor: "bg-amber-500",
        barColor: "bg-amber-500",
        percent: Math.min(100, (stock / 40) * 100),
        subtext: "High demand item, selling fast this week.",
      };
    } else {
      // Stage 1: High Stock -> Natural Stone / Black Color
      return {
        stage: "high",
        label: `In Stock (${stock} units available)`,
        textColor: "text-stone-900",
        dotColor: "bg-[#5B6240]",
        barColor: "bg-[#5B6240]",
        percent: 100,
        subtext: "Ready for immediate express dispatch across India.",
      };
    }
  }, [product?.stock]);

  // Price & Savings calculations
  const price = product?.price ?? 0;
  const comparePrice = product?.comparePrice ?? 0;
  const hasDiscount = comparePrice > price;
  const savings = hasDiscount ? comparePrice - price : 0;
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  // Filter valid specifications selected from Admin Panel
  const validSpecifications = useMemo(() => {
    if (!Array.isArray(product?.specifications)) return [];
    return product.specifications.filter((specItem) => {
      const hasSpecName = Boolean(
        specItem?.specification?.displayName || specItem?.specification?.name
      );
      const hasOptions =
        Array.isArray(specItem?.options) && specItem.options.length > 0;
      return hasSpecName || hasOptions;
    });
  }, [product?.specifications]);

  // Add to Bag / Increase Quantity Handler
  const handleAddToCart = () => {
    if (!product || (product.stock ?? 0) <= 0) return;

    try {
      const existing = localStorage.getItem("eclera_cart");
      let cart = existing ? JSON.parse(existing) : [];
      if (!Array.isArray(cart)) cart = [];

      const existingIndex = cart.findIndex((item: any) => item._id === product._id);
      const primaryImage =
        product.images?.[activeImageIndex]?.publicUrl ||
        product.images?.[activeImageIndex]?.url ||
        product.images?.[0]?.publicUrl ||
        product.images?.[0]?.url ||
        "";

      if (existingIndex > -1) {
        // Product already in cart: Increase quantity by selected quantity
        const currentQty = cart[existingIndex].quantity || 1;
        cart[existingIndex].quantity = currentQty + quantity;
      } else {
        // Product not in cart: Add product to cart with selected quantity
        cart.push({
          _id: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          comparePrice: product.comparePrice || product.price,
          image: primaryImage,
          quantity: quantity,
        });
      }

      localStorage.setItem("eclera_cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("eclera_cart_updated"));

      setAddedFeedback(true);
      setTimeout(() => {
        setAddedFeedback(false);
      }, 2500);
    } catch (err) {
      console.error("Failed to add to cart:", err);
    }
  };

  // Submit Review Handler
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewErrorMessage("");
    setReviewSuccessMessage("");

    if (!formName.trim()) {
      setReviewErrorMessage("Please enter your name.");
      return;
    }
    if (!formCountry.trim()) {
      setReviewErrorMessage("Please enter your country.");
      return;
    }
    if (!formMessage.trim()) {
      setReviewErrorMessage("Please write a review message.");
      return;
    }

    try {
      setSubmittingReview(true);
      const payload = {
        productSlug: slug,
        productId: product?._id,
        name: formName.trim(),
        country: formCountry.trim(),
        rating: formRating,
        message: formMessage.trim(),
      };

      const res = await api("reviews", payload, "POST");

      if (res?.status) {
        setReviewSuccessMessage(
          res.message || "Thank you! Your review has been submitted successfully."
        );
        setFormMessage("");

        // Instantly trigger priority social proof notification across the site
        if (typeof window !== "undefined") {
          const newReviewDetail = {
            _id: res.data?._id || String(Date.now()),
            name: formName.trim(),
            country: formCountry.trim(),
            rating: formRating,
            message: formMessage.trim(),
            productName: product?.name || res.data?.productName || "Eclera Formulation",
            productSlug: slug || res.data?.productSlug || "",
            productImage:
              product?.images?.[0]?.publicUrl ||
              product?.images?.[0]?.url ||
              res.data?.productImage ||
              "",
            createdAt: new Date().toISOString(),
            isInstantUserSubmission: true,
          };
          window.dispatchEvent(
            new CustomEvent("eclera_new_review", {
              detail: newReviewDetail,
            })
          );
        }

        // Refresh reviews list strictly from database
        try {
          const updated = await api(`reviews/${slug}`, undefined, "GET");
          if (updated?.status && updated.data) {
            setReviews(updated.data.reviews || []);
            if (updated.data.stats) {
              setReviewStats(updated.data.stats);
            }
          }
        } catch (err) {
          console.error("Failed to refresh reviews list:", err);
        }

        setTimeout(() => {
          setShowReviewForm(false);
          setReviewSuccessMessage("");
        }, 3000);
      } else {
        setReviewErrorMessage(res?.message || "Failed to submit review.");
      }
    } catch (err: any) {
      setReviewErrorMessage(err?.message || "Error submitting review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-[#FAF7F5] min-h-screen py-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 animate-pulse">
            <div className="lg:col-span-7 aspect-square bg-stone-200" />
            <div className="lg:col-span-5 space-y-6">
              <div className="h-6 w-1/3 bg-stone-200" />
              <div className="h-10 w-3/4 bg-stone-200" />
              <div className="h-12 w-1/2 bg-stone-200" />
              <div className="h-14 w-full bg-stone-200" />
              <div className="h-12 w-full bg-stone-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="w-full bg-[#FAF7F5] min-h-[60vh] flex flex-col items-center justify-center py-16 px-4">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Product Not Found</h1>
        <p className="text-sm text-stone-500 mb-6">
          The product you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/categories"
          className="px-6 py-3 bg-[#5B6240] hover:bg-[#474D32] text-white text-xs font-bold uppercase tracking-wider transition-colors"
        >
          Browse All Categories
        </Link>
      </div>
    );
  }

  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [];
  const currentImageUrl =
    images[activeImageIndex]?.publicUrl || images[activeImageIndex]?.url || "";

  return (
    <div className="w-full bg-[#FAF7F5] min-h-screen pb-20">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-stone-500 font-medium">
            <Link href="/" className="hover:text-[#5B6240] transition-colors">
              Home
            </Link>
            <FiChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <Link href="/categories" className="hover:text-[#5B6240] transition-colors">
              Categories
            </Link>
            {product.category && (
              <>
                <FiChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <Link
                  href={`/category/${product.category.slug}`}
                  className="hover:text-[#5B6240] transition-colors truncate max-w-[150px]"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <FiChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="text-stone-900 font-semibold uppercase tracking-wider text-[11px] truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Product Section: Gallery & Details (Direct layout, outer box removed) */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Large Highlighted Image Gallery */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Main Showcase Image Container */}
            <div className="relative aspect-square w-full bg-white border border-stone-200 overflow-hidden flex items-center justify-center shadow-xs">
              {currentImageUrl ? (
                <img
                  src={currentImageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105 cursor-crosshair"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-stone-300">
                  <FiImage className="w-16 h-16 mb-2" />
                  <span className="text-xs uppercase tracking-widest text-stone-400 font-semibold">
                    Eclera Cosmetics
                  </span>
                </div>
              )}

              {/* Discount Percentage Badge on Image */}
              {hasDiscount && (
                <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-extrabold px-3 py-1.5 uppercase tracking-wider shadow-sm">
                  {discountPercent}% OFF
                </div>
              )}
            </div>

            {/* Thumbnail Navigation Row */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {images.map((img, idx) => {
                  const thumbUrl = img.publicUrl || img.url || "";
                  const isActive = idx === activeImageIndex;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative aspect-square bg-white border-2 overflow-hidden transition-all duration-200 cursor-pointer ${isActive
                        ? "border-[#5B6240] ring-1 ring-[#5B6240]"
                        : "border-stone-200 hover:border-stone-400 opacity-70 hover:opacity-100"
                        }`}
                    >
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={`${product.name} thumb ${idx + 1}`}
                          className="w-full h-full object-cover object-center"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-stone-100 text-[10px] text-stone-400">
                          #{idx + 1}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Direct Details (Outer Box Removed for clean, airy layout) */}
          <div className="lg:col-span-5 flex flex-col space-y-6 pt-1 lg:pl-2">
            {/* Top: Category (Direct medium-bold text in primary color, no tag box) */}
            <div>
              {product.category?.slug ? (
                <Link
                  href={`/category/${product.category.slug}`}
                  className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-[#5B6240] hover:text-[#474D32] transition-colors inline-block"
                >
                  {product.category.name}
                </Link>
              ) : (
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-[#5B6240] inline-block">
                  {product.category?.name || "Eclera Formulations"}
                </span>
              )}
            </div>

            {/* Product Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight leading-snug">
                {product.name}
              </h1>

              {/* Star Rating & Reviews Summary Jump Link */}
              <div className="mt-3 flex items-center gap-3">
                {reviewStats.totalReviews > 0 ? (
                  <>
                    <div className="flex items-center text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FiStar
                          key={star}
                          className={`w-4 h-4 ${star <= Math.round(reviewStats.averageRating || 0)
                            ? "fill-amber-400 text-amber-400"
                            : "text-stone-300"
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-stone-900">
                      {reviewStats.averageRating}
                    </span>
                    <span className="text-xs text-stone-400">|</span>
                    <a
                      href="#customer-experience"
                      onClick={() => {
                        setOpenAccordions((prev) => ({ ...prev, reviews: true }));
                      }}
                      className="text-xs text-[#5B6240] hover:underline font-semibold"
                    >
                      {reviewStats.totalReviews} Customer {reviewStats.totalReviews === 1 ? "Experience" : "Experiences"}
                    </a>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center text-stone-300">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FiStar key={star} className="w-3.5 h-3.5 text-stone-300" />
                      ))}
                    </div>
                    <span className="text-xs text-stone-400 font-medium">No reviews yet</span>
                    <span className="text-stone-300">|</span>
                    <a
                      href="#customer-experience"
                      onClick={() => {
                        setOpenAccordions((prev) => ({ ...prev, reviews: true }));
                        setShowReviewForm(true);
                      }}
                      className="text-xs text-[#5B6240] hover:underline font-semibold"
                    >
                      Write a Review
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Highlighting Price & MRP Section (Fixed perfect vertical & horizontal alignment) */}
            <div className="pt-2 pb-5 border-b border-stone-200">
              <div className="flex items-center flex-wrap gap-2.5 sm:gap-3.5">
                {/* Large Prominent Current Price */}
                <span className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight leading-none inline-flex items-center">
                  ₹{price.toLocaleString("en-IN")}
                </span>

                {/* Strikethrough MRP - Larger font size */}
                {hasDiscount && (
                  <span className="text-lg sm:text-xl text-stone-400 line-through font-bold leading-none inline-flex items-center">
                    ₹{comparePrice.toLocaleString("en-IN")}
                  </span>
                )}

                {/* Savings Badge - perfectly centered with fixed height */}
                {hasDiscount && (
                  <span className="inline-flex items-center justify-center bg-red-600 text-white text-[11px] sm:text-xs font-bold px-2.5 h-[26px] tracking-wider uppercase leading-none shadow-2xs">
                    Save ₹{savings.toLocaleString("en-IN")} ({discountPercent}% OFF)
                  </span>
                )}
              </div>
              <p className="mt-2 text-[11px] text-stone-500 font-medium">
                1M+ Customers Loved· Free Shipping in Surat (GJ-05). ❤️
              </p>
            </div>

            {/* Dynamic 3-Color Stock Status Section (Direct details, no boxed frame) */}
            <div className="pb-5 border-b border-stone-200 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 shrink-0 ${stockInfo.dotColor}`} />
                  <span className={`text-xs sm:text-sm font-bold tracking-tight ${stockInfo.textColor}`}>
                    {stockInfo.label}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-stone-500">
                  {stockInfo.stage === "critical"
                    ? "Limited"
                    : stockInfo.stage === "warning"
                      ? "Selling Fast"
                      : "In Stock"}
                </span>
              </div>

              {/* Dynamic Stock Indicator Progress Bar matching stage color */}
              <div className="w-full h-1.5 bg-stone-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${stockInfo.barColor}`}
                  style={{ width: `${stockInfo.percent}%` }}
                />
              </div>

              <p className="text-[11px] text-stone-500 leading-tight">
                {stockInfo.subtext}
              </p>
            </div>

            {/* Quantity Selector & Add to Bag Button */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-stone-300 bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || (product.stock ?? 0) <= 0}
                    className="w-10 h-11 flex items-center justify-center text-stone-600 hover:text-stone-900 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Decrease quantity"
                  >
                    <FiMinus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-stone-900 select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stock ?? 10, q + 1))}
                    disabled={quantity >= (product.stock ?? 10) || (product.stock ?? 0) <= 0}
                    className="w-10 h-11 flex items-center justify-center text-stone-600 hover:text-stone-900 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Increase quantity"
                  >
                    <FiPlus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add to Bag Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={(product.stock ?? 0) <= 0}
                  className={`flex-1 h-11 px-6 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed ${(product.stock ?? 0) <= 0
                    ? "bg-stone-300 text-stone-500"
                    : addedFeedback
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-[#5B6240] hover:bg-[#474D32] text-white shadow-sm"
                    }`}
                >
                  {addedFeedback ? (
                    <>
                      <FiCheck className="w-4 h-4" />
                      <span>Added to Bag ✓ ({quantity})</span>
                    </>
                  ) : (product.stock ?? 0) <= 0 ? (
                    <span>Sold Out</span>
                  ) : (
                    <>
                      <FiShoppingBag className="w-4 h-4" />
                      <span>Add to Bag</span>
                    </>
                  )}
                </button>
              </div>

              {/* Added confirmation feedback banner */}
              {addedFeedback && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center justify-between">
                  <span>Cart updated! Added {quantity} item(s) to your bag.</span>
                  <Link href="/cart" className="underline font-bold text-emerald-900">
                    View Bag →
                  </Link>
                </div>
              )}
            </div>

            {/* Trust Assurances */}
            <div className="pt-2 grid grid-cols-2 gap-4 text-stone-700">
              <div className="flex items-center gap-2.5 text-xs">
                <FiShield className="w-4 h-4 text-[#5B6240] shrink-0" />
                <span>100% Authentic & Clean</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <FiTruck className="w-4 h-4 text-[#5B6240] shrink-0" />
                <span>Express Pan-India Delivery</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <FiRefreshCw className="w-4 h-4 text-[#5B6240] shrink-0" />
                <span>Safe Dermatologist Tested</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <FiGlobe className="w-4 h-4 text-[#5B6240] shrink-0" />
                <span>Cruelty-Free Formulation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accordion / Collapsible Sections Container */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16 space-y-4">
        {/* Accordion Item 1: Product Description (Default Open) */}
        <div className="border border-stone-200 bg-white shadow-xs">
          <button
            type="button"
            onClick={() => toggleAccordion("description")}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-stone-50/70 transition-colors cursor-pointer select-none"
            aria-expanded={openAccordions.description}
          >
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                Product Description & Details
              </h2>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Formulation insights, usage rituals & key skincare benefits
              </p>
            </div>
            {/* ONLY up/down chevron arrow */}
            <div className="shrink-0 ml-4">
              <FiChevronDown
                className={`w-5 h-5 text-stone-600 transform transition-transform duration-200 ${openAccordions.description ? "rotate-180" : ""
                  }`}
              />
            </div>
          </button>

          {openAccordions.description && (
            <div className="p-5 sm:p-8 border-t border-stone-200 bg-white">
              {product.description && product.description.trim() ? (
                <div
                  className="prose prose-stone max-w-none text-xs sm:text-sm text-stone-700 leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="text-xs sm:text-sm text-stone-500 italic">
                  No detailed description provided for this formulation.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Accordion Item 2: Product Specifications (Border-based Grouping, Multiple Options Handling) */}
        {validSpecifications.length > 0 && (
          <div className="border border-stone-200 bg-white shadow-xs">
            <button
              type="button"
              onClick={() => toggleAccordion("specifications")}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-stone-50/70 transition-colors cursor-pointer select-none"
              aria-expanded={openAccordions.specifications}
            >
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                  Product Specifications
                </h2>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Formulation attributes & specifications selected in Admin Panel
                </p>
              </div>
              {/* ONLY up/down chevron arrow */}
              <div className="shrink-0 ml-4">
                <FiChevronDown
                  className={`w-5 h-5 text-stone-600 transform transition-transform duration-200 ${openAccordions.specifications ? "rotate-180" : ""
                    }`}
                />
              </div>
            </button>

            {openAccordions.specifications && (
              <div className="p-5 sm:p-8 border-t border-stone-200 bg-white">
                {/* Clean Border-based Grouping: No tags, pure border divisions */}
                <div className="border border-stone-200 divide-y divide-stone-200">
                  {validSpecifications.map((specItem, idx) => {
                    const title =
                      specItem.specification?.displayName ||
                      specItem.specification?.name ||
                      "Specification";
                    const options = Array.isArray(specItem.options) ? specItem.options : [];

                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-1 md:grid-cols-12 transition-colors"
                      >
                        {/* Specification Group Title Header (Left side on desktop, top on mobile) */}
                        <div className="md:col-span-4 lg:col-span-3 p-4 sm:p-5 bg-[#FAF7F5] md:border-r border-b md:border-b-0 border-stone-200 flex items-center">
                          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-900">
                            {title}
                          </span>
                        </div>

                        {/* Options Grouping: Clean ul / li layout */}
                        <div className="md:col-span-8 lg:col-span-9 p-4 sm:p-5 bg-white">
                          {options.length > 0 ? (
                            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {options.map((opt, optIdx) => (
                                <li
                                  key={opt._id || optIdx}
                                  className="flex items-center gap-2.5 text-xs sm:text-sm text-stone-800 font-medium py-1"
                                >
                                  <span className="w-1.5 h-1.5 bg-[#5B6240] shrink-0" />
                                  <span className="break-words">{opt.name || opt.value}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-xs text-stone-400 italic">
                              No options specified
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Accordion Item 3: Customer Experience & Reviews (Highlighted Rating in Header) */}
        <div
          id="customer-experience"
          className="border border-stone-200 bg-white shadow-xs scroll-mt-24"
        >
          <button
            type="button"
            onClick={() => toggleAccordion("reviews")}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-stone-50/70 transition-colors cursor-pointer select-none"
            aria-expanded={openAccordions.reviews}
          >
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                Customer Experience
              </h2>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {reviewStats.totalReviews > 0
                  ? `${reviewStats.totalReviews} Verified customer ratings & reviews`
                  : "Be the first to share your experience with this formulation"}
              </p>
            </div>

            {/* ONLY highlighted average review snippet on Customer Experience + up/down arrow */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 ml-4">
              {reviewStats.totalReviews > 0 ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF3DD] border border-[#DECD87] text-stone-900 text-xs font-bold shadow-2xs">
                  <FiStar className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>
                    {reviewStats.averageRating} / 5.0
                  </span>
                  <span className="text-stone-500 font-normal hidden sm:inline">
                    ({reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? "Review" : "Reviews"})
                  </span>
                </div>
              ) : (
                <div className="px-2.5 py-1 bg-stone-100 border border-stone-200 text-stone-400 text-xs font-medium">
                  0 Reviews
                </div>
              )}
              <FiChevronDown
                className={`w-5 h-5 text-stone-600 transform transition-transform duration-200 ${openAccordions.reviews ? "rotate-180" : ""
                  }`}
              />
            </div>
          </button>

          {openAccordions.reviews && (
            <div className="p-5 sm:p-8 border-t border-stone-200 bg-white">
              {/* Write Review Action Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-6 mb-8">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5B6240]">
                    Verified Feedback
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight mt-0.5">
                    Ratings & Feedback
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(!showReviewForm);
                    setReviewErrorMessage("");
                    setReviewSuccessMessage("");
                  }}
                  className="px-5 py-2.5 bg-[#5B6240] hover:bg-[#474D32] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FiMessageSquare className="w-4 h-4" />
                  <span>{showReviewForm ? "Close Review Form" : "Write Customer Review"}</span>
                </button>
              </div>

              {/* Interactive Review Form */}
              {showReviewForm && (
                <div className="bg-[#FAF9EB] border border-[#D5D9C8] p-6 sm:p-8 mb-10 transition-all duration-300">
                  <h4 className="text-base sm:text-lg font-bold text-stone-900 mb-1">
                    Share Your Customer Experience
                  </h4>
                  <p className="text-xs text-stone-500 mb-6">
                    Your feedback helps our dermatologists and other skincare enthusiasts make the best decisions.
                  </p>

                  {reviewSuccessMessage && (
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold">
                      {reviewSuccessMessage}
                    </div>
                  )}

                  {reviewErrorMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-800 text-xs font-semibold">
                      {reviewErrorMessage}
                    </div>
                  )}

                  <form onSubmit={handleSubmitReview} className="space-y-4 max-w-2xl">
                    {/* Rating selection with clickable stars */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                        Your Rating:
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFormRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <FiStar
                              className={`w-6 h-6 ${star <= (hoverRating || formRating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-stone-300"
                                }`}
                            />
                          </button>
                        ))}
                        <span className="ml-2 text-xs font-bold text-stone-700">
                          {formRating} of 5 Stars
                        </span>
                      </div>
                    </div>

                    {/* Customer Name & Country Fields (strictly blank if not logged in) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                          Your Full Name *
                        </label>
                        <input
                          type="text"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Enter your name"
                          required
                          className="w-full px-3.5 py-2.5 bg-white border border-stone-300 text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#5B6240]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                          Your Country *
                        </label>
                        <input
                          type="text"
                          value={formCountry}
                          onChange={(e) => setFormCountry(e.target.value)}
                          placeholder="e.g. India, United States, UAE"
                          required
                          className="w-full px-3.5 py-2.5 bg-white border border-stone-300 text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#5B6240]"
                        />
                      </div>
                    </div>

                    {/* Review Message */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                        Your Experience & Feedback *
                      </label>
                      <textarea
                        rows={4}
                        value={formMessage}
                        onChange={(e) => setFormMessage(e.target.value)}
                        placeholder="Describe how the formulation felt, skin texture improvements, hydration results, etc."
                        required
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#5B6240]"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-6 py-3 bg-[#5B6240] hover:bg-[#474D32] text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {submittingReview ? "Submitting Review..." : "Submit Experience"}
                    </button>
                  </form>
                </div>
              )}

              {/* If reviews exist in database: Render Rating Summary Bar */}
              {reviewStats.totalReviews > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#FAF7F5] border border-stone-200 p-6 mb-8">
                  {/* Overall Score */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-stone-200 pb-6 md:pb-0 md:pr-6">
                    <span className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tight">
                      {reviewStats.averageRating}
                    </span>
                    <div className="flex items-center text-amber-500 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FiStar
                          key={star}
                          className={`w-4 h-4 ${star <= Math.round(reviewStats.averageRating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-stone-300"
                            }`}
                        />
                      ))}
                    </div>
                    <span className="mt-1 text-xs text-stone-500">
                      Based on {reviewStats.totalReviews} verified reviews
                    </span>
                  </div>

                  {/* Rating Breakdown Bars */}
                  <div className="md:col-span-8 space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviewStats.breakdown?.[String(star)] || 0;
                      const pct =
                        reviewStats.totalReviews > 0
                          ? Math.round((count / reviewStats.totalReviews) * 100)
                          : 0;

                      return (
                        <div key={star} className="flex items-center gap-3 text-xs">
                          <span className="w-12 text-stone-700 font-semibold flex items-center gap-1">
                            <span>{star}</span>
                            <FiStar className="w-3 h-3 fill-amber-400 text-amber-400" />
                          </span>
                          <div className="flex-1 h-2 bg-stone-200 overflow-hidden">
                            <div
                              className="h-full bg-[#5B6240] transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-stone-500 font-mono">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Customer Reviews List or Dedicated "No Customer Reviews" Design */}
              {reviewsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="p-4 bg-stone-100 animate-pulse h-24" />
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                /* Dedicated "No Customer Reviews" Design (Hidden when Write Review Form is open) */
                !showReviewForm ? (
                  <div className="bg-[#FAF7F5] border border-stone-200 p-8 sm:p-12 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-[#F1F3EC] border border-[#D5D9C8] flex items-center justify-center text-[#5B6240] mb-4">
                      <FiEdit3 className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-stone-900 mb-1.5">
                      No Customer Reviews Yet
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-500 max-w-md mb-6 leading-relaxed">
                      There are currently no reviews written for this formulation. Have you tried it? Share your skincare experience with the Eclera community.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(true)}
                      className="px-6 py-3 bg-[#5B6240] hover:bg-[#474D32] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <FiMessageSquare className="w-4 h-4" />
                      <span>Write The First Review</span>
                    </button>
                  </div>
                ) : null
              ) : (
                /* Verified Customer Reviews List */
                <div className="divide-y divide-stone-200">
                  {reviews.map((rev) => (
                    <div key={rev._id} className="py-6 first:pt-2 last:pb-2 space-y-2.5">
                      {/* Review Top: Customer Name, Country, Verified, Date */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-[#5B6240] text-white flex items-center justify-center text-xs font-bold uppercase">
                            {rev.name ? rev.name[0] : "C"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-bold text-stone-900">
                                {rev.name}
                              </span>
                              {rev.country && (
                                <span className="text-[10px] bg-stone-100 border border-stone-200 px-2 py-0.5 text-stone-600 font-semibold uppercase tracking-wider">
                                  📍 {rev.country}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center text-amber-500">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <FiStar
                                key={s}
                                className={`w-3.5 h-3.5 ${s <= rev.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-stone-300"
                                  }`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-stone-400">
                            {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Review Message */}
                      <p className="text-xs sm:text-sm text-stone-700 leading-relaxed pt-1">
                        {rev.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
