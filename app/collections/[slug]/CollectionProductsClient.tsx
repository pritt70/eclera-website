"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import {
  FiShoppingBag,
  FiCheck,
  FiStar,
  FiImage,
  FiFilter,
  FiX,
  FiChevronDown,
} from "react-icons/fi";
import { api } from "@/helper";
import { ProductCard } from "@/components/ProductCard";

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
    specifications?: any[];
  };
  rating?: number;
  reviewsCount?: number;
  description?: string;
  status?: string;
  sortOrder?: number;
  flipkartUrl?: string;
  specifications?: any[];
}

interface CollectionInfo {
  _id: string;
  name: string;
  slug: string;
  image?: {
    url?: string;
    publicUrl?: string;
  };
  description?: string;
  products?: any[];
}

interface CategoryOption {
  id: string;
  name: string;
  slug?: string;
  count?: number;
}

interface SpecItem {
  id: string;
  name: string;
  options: { id: string; name: string; count?: number }[];
}

export default function CollectionProductsClient({ slug }: { slug: string }) {
  const [collection, setCollection] = useState<CollectionInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  // Sorting state
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "rating">("featured");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const SORT_OPTIONS: { id: "featured" | "price-asc" | "price-desc" | "rating"; label: string }[] = [
    { id: "featured", label: "Featured" },
    { id: "price-asc", label: "Price: Low to High" },
    { id: "price-desc", label: "Price: High to Low" },
    { id: "rating", label: "Highest Rated" },
  ];

  // Close custom sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(e.target as Node)
      ) {
        setSortDropdownOpen(false);
      }
    };
    if (sortDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sortDropdownOpen]);

  // Mobile Drawer state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter States
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [minBound, setMinBound] = useState<number>(0);
  const [maxBound, setMaxBound] = useState<number>(5000);

  // Filter Metadata from Backend
  const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>([]);
  const [availableSpecifications, setAvailableSpecifications] = useState<SpecItem[]>([]);

  // Track whether initial baseline load has completed
  const isInitialLoadedRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Collapsible filter sections (all expanded by default)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    price: true,
    categories: true,
  });

  const toggleSection = (sec: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sec]: !prev[sec],
    }));
  };

  // 1. Initial Load: Fetch Collection & Metadata
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        setInitialLoading(true);

        const colRes = await api(`collections/${slug}`, undefined, "GET");

        if (!isMounted) return;

        let colData: CollectionInfo = {
          _id: slug,
          name: slug
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
          slug,
        };

        if (colRes?.status && colRes.data) {
          colData = colRes.data;
          setCollection(colData);

          const prods = Array.isArray(colRes.data.products) ? colRes.data.products : [];
          setProducts(prods);

          // Use filterMeta from backend if provided
          if (colRes.data.filterMeta) {
            const fm = colRes.data.filterMeta;
            const bMin = typeof fm.minPrice === "number" ? fm.minPrice : 0;
            const bMax = typeof fm.maxPrice === "number" ? fm.maxPrice : 5000;
            setMinBound(bMin);
            setMaxBound(bMax);
            setPriceRange([bMin, bMax]);

            if (Array.isArray(fm.categories)) {
              setAvailableCategories(fm.categories);
            }
            if (Array.isArray(fm.specifications)) {
              setAvailableSpecifications(fm.specifications);
            }
          } else if (prods.length > 0) {
            // Fallback price bounds computation
            const prices = prods.map((p: any) => Number(p.price) || 0);
            const rawMin = Math.min(...prices);
            const rawMax = Math.max(...prices);
            const calcMin = Math.max(0, Math.floor(rawMin / 50) * 50);
            const calcMax = Math.max(calcMin + 100, Math.ceil(rawMax / 50) * 50);
            setMinBound(calcMin);
            setMaxBound(calcMax);
            setPriceRange([calcMin, calcMax]);
          }
        }

        // Determine banner image directly from collection's own image (or null to hide)
        const colImg = colData?.image?.publicUrl || colData?.image?.url || "";
        const resolvedBanner = colImg && colImg.trim() !== "" ? colImg.trim() : null;
        setBannerUrl(resolvedBanner);
        isInitialLoadedRef.current = true;
      } catch (err) {
        console.error("Failed to load initial collection data:", err);
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // 2. Server-side Database Filtering API Call
  const fetchFilteredProducts = useCallback(
    async (
      currentPriceRange: [number, number],
      currentCategories: string[],
      currentOptions: string[],
      currentSort: string
    ) => {
      try {
        setFilterLoading(true);

        const params = new URLSearchParams();
        params.set("minPrice", String(currentPriceRange[0]));
        params.set("maxPrice", String(currentPriceRange[1]));

        if (currentCategories.length > 0) {
          params.set("categories", currentCategories.join(","));
        }
        if (currentOptions.length > 0) {
          params.set("options", currentOptions.join(","));
        }
        if (currentSort) {
          params.set("sortBy", currentSort);
        }

        const endpoint = `collections/${slug}?${params.toString()}`;
        const res = await api(endpoint, undefined, "GET");

        if (res?.status && res.data) {
          const fetchedProducts = Array.isArray(res.data.products) ? res.data.products : [];
          setProducts(fetchedProducts);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Error fetching filtered products from database:", err);
        setProducts([]);
      } finally {
        setFilterLoading(false);
      }
    },
    [slug]
  );

  // 3. Trigger API Call whenever any filter or sorting changes (debounced for smooth slider)
  useEffect(() => {
    // Skip before initial baseline data has arrived
    if (!isInitialLoadedRef.current) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchFilteredProducts(priceRange, selectedCategories, selectedOptions, sortBy);
    }, 280);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [priceRange, selectedCategories, selectedOptions, sortBy, fetchFilteredProducts]);

  // Handle Category selection
  const handleToggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  // Handle Specification Option selection
  const handleToggleOption = (optId: string) => {
    setSelectedOptions((prev) =>
      prev.includes(optId) ? prev.filter((id) => id !== optId) : [...prev, optId]
    );
  };

  // Reset ALL Filters
  const handleResetFilters = () => {
    setPriceRange([minBound, maxBound]);
    setSelectedCategories([]);
    setSelectedOptions([]);
  };

  // Check if any filter is active
  const isFilterActive = useMemo(() => {
    const priceChanged =
      priceRange[0] > minBound || priceRange[1] < maxBound;
    return (
      priceChanged ||
      selectedCategories.length > 0 ||
      selectedOptions.length > 0
    );
  }, [priceRange, minBound, maxBound, selectedCategories, selectedOptions]);

  // Quick Cart Add Handler
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

      setAddedProductId(product._id);
      setTimeout(() => {
        setAddedProductId(null);
      }, 2000);
    } catch (err) {
      console.error("Error adding product to cart:", err);
    }
  };

  // Step for fixed range slider
  const step = useMemo(() => {
    const diff = maxBound - minBound;
    if (diff <= 500) return 20;
    if (diff <= 2000) return 50;
    return 100;
  }, [minBound, maxBound]);

  // Dual Range Percentage calculations for filled track
  const minPercent = useMemo(() => {
    const total = maxBound - minBound || 1;
    return Math.max(0, Math.min(100, ((priceRange[0] - minBound) / total) * 100));
  }, [priceRange, minBound, maxBound]);

  const maxPercent = useMemo(() => {
    const total = maxBound - minBound || 1;
    return Math.max(0, Math.min(100, ((priceRange[1] - minBound) / total) * 100));
  }, [priceRange, minBound, maxBound]);

  // Reusable Filter Content (for both Desktop Sidebar & Mobile Drawer)
  const FilterContent = (
    <div className="flex flex-col h-full">
      {/* Header: "Filters" title (Left) + "Reset Filter" button (Right) */}
      <div className="shrink-0 bg-white border-b border-stone-200 px-5 py-4 flex items-center justify-between shadow-2xs">
        <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider">
          Filters
        </h3>
        <button
          type="button"
          onClick={handleResetFilters}
          disabled={!isFilterActive}
          className={`text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
            isFilterActive
              ? "text-[#5B6240] hover:text-[#474D32] underline underline-offset-2"
              : "text-stone-300 cursor-not-allowed"
          }`}
        >
          Reset Filter
        </button>
      </div>

      {/* Scrollable Filter Sections */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* 1. Price Range Filter (Dual Thumb Slider) */}
        <div className="space-y-3.5 pb-5 border-b border-stone-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-800 uppercase tracking-wider">
              Price Range
            </span>
            <span className="text-xs font-semibold text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded-none">
              ₹{priceRange[0]} - ₹{priceRange[1]}
            </span>
          </div>

          {/* Dual Thumb Range Slider Track */}
          <div className="relative w-full pt-4 pb-2">
            {/* Background Track */}
            <div className="relative w-full h-1.5 bg-stone-200 rounded-full">
              {/* Highlighted Active Range Bar */}
              <div
                className="absolute h-full bg-[#5B6240] rounded-full"
                style={{
                  left: `${minPercent}%`,
                  width: `${maxPercent - minPercent}%`,
                }}
              />
            </div>

            {/* Min Range Slider Input */}
            <input
              type="range"
              min={minBound}
              max={maxBound}
              step={step}
              value={priceRange[0]}
              aria-label="Minimum Price"
              onChange={(e) => {
                const val = Math.min(Number(e.target.value), priceRange[1] - step);
                setPriceRange([val, priceRange[1]]);
              }}
              className="absolute inset-x-0 top-3 w-full h-3 appearance-none bg-transparent pointer-events-none cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#5B6240] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#5B6240] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
            />

            {/* Max Range Slider Input */}
            <input
              type="range"
              min={minBound}
              max={maxBound}
              step={step}
              value={priceRange[1]}
              aria-label="Maximum Price"
              onChange={(e) => {
                const val = Math.max(Number(e.target.value), priceRange[0] + step);
                setPriceRange([priceRange[0], val]);
              }}
              className="absolute inset-x-0 top-3 w-full h-3 appearance-none bg-transparent pointer-events-none cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#5B6240] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#5B6240] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
            />

            {/* Min / Max Bound Labels */}
            <div className="flex items-center justify-between text-[11px] text-stone-400 mt-3 font-medium">
              <span>₹{minBound}</span>
              <span>₹{maxBound}</span>
            </div>
          </div>
        </div>

        {/* 2. Categories Filter (Checkboxes) */}
        {availableCategories.length > 0 && (
          <div className="space-y-3 pb-5 border-b border-stone-200/80">
            <button
              type="button"
              onClick={() => toggleSection("categories")}
              className="w-full flex items-center justify-between text-left group cursor-pointer"
            >
              <span className="text-xs font-semibold text-stone-800 uppercase tracking-wider">
                Categories
              </span>
              <FiChevronDown
                className={`w-4 h-4 text-stone-500 transition-transform duration-200 ${
                  expandedSections.categories ? "rotate-180" : ""
                }`}
              />
            </button>

            {expandedSections.categories && (
              <div className="space-y-2 pt-1 max-h-48 overflow-y-auto pr-1">
                {availableCategories.map((cat) => {
                  const checked = selectedCategories.includes(cat.id);
                  return (
                    <label
                      key={cat.id}
                      className="flex items-center justify-between text-xs text-stone-700 hover:text-stone-900 cursor-pointer select-none py-1 group/item"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleCategory(cat.id)}
                          className="w-3.5 h-3.5 rounded-none text-[#5B6240] border-stone-300 focus:ring-[#5B6240] cursor-pointer"
                        />
                        <span className={`transition-colors ${checked ? "font-semibold text-[#5B6240]" : ""}`}>
                          {cat.name}
                        </span>
                      </div>
                      {typeof cat.count === "number" && (
                        <span className="text-[11px] text-stone-400">
                          ({cat.count})
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. Specifications Filters (Options Checkboxes grouped by Specification) */}
        {availableSpecifications.map((spec) => {
          const isExpanded = expandedSections[spec.id] ?? true;
          return (
            <div key={spec.id} className="space-y-3 pb-5 border-b border-stone-200/80 last:border-b-0">
              <button
                type="button"
                onClick={() => toggleSection(spec.id)}
                className="w-full flex items-center justify-between text-left group cursor-pointer"
              >
                <span className="text-xs font-semibold text-stone-800 uppercase tracking-wider">
                  {spec.name}
                </span>
                <FiChevronDown
                  className={`w-4 h-4 text-stone-500 transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isExpanded && (
                <div className="space-y-2 pt-1 max-h-44 overflow-y-auto pr-1">
                  {spec.options.map((opt) => {
                    const checked = selectedOptions.includes(opt.id) || selectedOptions.includes(opt.name);
                    return (
                      <label
                        key={opt.id}
                        className="flex items-center justify-between text-xs text-stone-700 hover:text-stone-900 cursor-pointer select-none py-1 group/item"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleOption(opt.id)}
                            className="w-3.5 h-3.5 rounded-none text-[#5B6240] border-stone-300 focus:ring-[#5B6240] cursor-pointer"
                          />
                          <span className={`transition-colors ${checked ? "font-semibold text-[#5B6240]" : ""}`}>
                            {opt.name}
                          </span>
                        </div>
                        {typeof opt.count === "number" && opt.count > 0 && (
                          <span className="text-[11px] text-stone-400">
                            ({opt.count})
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="w-full bg-[#FAF7F5] min-h-screen pb-16 sm:pb-24">
      {/* 1. Collection Banner (Responsive height, compact & clean across all screens) */}
      {bannerUrl && bannerUrl.trim() !== "" ? (
        <section className="w-full bg-[#F5F2ED] border-b border-stone-200 overflow-hidden">
          <div className="w-full max-w-[1920px] mx-auto">
            <img
              src={bannerUrl}
              alt={collection?.name || "Collection Banner"}
              className="w-full h-[150px] sm:h-[200px] md:h-[250px] lg:h-[290px] xl:h-[310px] object-cover object-center block"
            />
          </div>
        </section>
      ) : null}

      {/* Main Container */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Clean Collection Title Header with Signature Accent Bar */}
        <div className="mb-6 sm:mb-8 pb-4 border-b border-stone-200/80">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-stone-900 tracking-tight">
            {collection?.name || "Collection"}
          </h1>
          <div className="w-16 sm:w-20 h-[3.5px] bg-[#5B6240] rounded-none mt-2.5 sm:mt-3" />
        </div>

        {/* Layout: Left Filter Drawer (Sidebar on desktop) + Right Product List */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* Desktop Left Filter Sidebar (Sticky, with fixed sticky header inside) */}
          <aside
            style={{
              top: "calc(var(--site-header-height, 112px) + 20px)",
              maxHeight: "calc(100vh - var(--site-header-height, 112px) - 36px)",
            }}
            className="hidden lg:block w-72 shrink-0 bg-white border border-stone-200 shadow-2xs sticky z-30 overflow-hidden"
          >
            {FilterContent}
          </aside>

          {/* Right Product Section */}
          <main className="flex-1 w-full min-w-0">
            {/* Header above product list:
                Left side: simple only "Products" title
                Right side: sort by text (NO icon) + select combo box
            */}
            <div className="bg-white border border-stone-200 p-4 sm:p-5 flex items-center justify-between gap-4 shadow-2xs mb-6">
              <div className="flex items-center gap-3">
                {/* Mobile Filter Button */}
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-[#5B6240] text-white text-xs font-semibold uppercase tracking-wider rounded-none cursor-pointer"
                >
                  <FiFilter className="w-3.5 h-3.5" />
                  <span>Filters</span>
                  {isFilterActive && (
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </button>

                {/* Left Side: simple only "Products" title */}
                <h2 className="text-base sm:text-lg font-semibold text-stone-900 tracking-tight">
                  Products
                </h2>
              </div>

              {/* Right Side: Luxury Custom Sort Dropdown */}
              <div className="relative" ref={sortDropdownRef}>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500 font-medium tracking-wide hidden sm:inline">
                    Sort by:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSortDropdownOpen((prev) => !prev)}
                    className="inline-flex items-center justify-between gap-3 min-w-[145px] sm:min-w-[170px] px-3.5 py-2 bg-white hover:bg-stone-50/80 border border-stone-200 hover:border-stone-300 text-xs font-semibold text-stone-900 tracking-wide transition-all shadow-2xs cursor-pointer select-none rounded-none focus:outline-none focus:border-[#5B6240]"
                    aria-haspopup="listbox"
                    aria-expanded={sortDropdownOpen}
                  >
                    <span>
                      {SORT_OPTIONS.find((o) => o.id === sortBy)?.label || "Featured"}
                    </span>
                    <FiChevronDown
                      className={`w-3.5 h-3.5 text-stone-500 transition-transform duration-200 ${
                        sortDropdownOpen ? "rotate-180 text-[#5B6240]" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Popover Menu with Active Checkmark */}
                {sortDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 sm:w-52 bg-white border border-stone-200 shadow-xl rounded-none py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                    {SORT_OPTIONS.map((opt) => {
                      const isSelected = sortBy === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSortBy(opt.id);
                            setSortDropdownOpen(false);
                          }}
                          className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#FAF7F5] font-semibold text-[#5B6240]"
                              : "text-stone-700 hover:bg-stone-50 font-normal"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && (
                            <FiCheck className="w-3.5 h-3.5 text-[#5B6240]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Product Cards Grid / Empty State */}
            {initialLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-white border border-stone-200 p-3 flex flex-col space-y-3 animate-pulse"
                  >
                    <div className="w-full aspect-square bg-stone-100" />
                    <div className="h-4 bg-stone-100 w-3/4 rounded-none" />
                    <div className="h-3 bg-stone-100 w-1/2 rounded-none" />
                    <div className="h-8 bg-stone-100 w-full mt-auto rounded-none" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              /* No products found state:
                 "No Any product found" text + "Reset Filter" button right below it
              */
              <div className="bg-white border border-stone-200 py-16 px-6 text-center flex flex-col items-center justify-center shadow-2xs">
                <h3 className="text-base font-semibold text-stone-800 mb-4">
                  No Any product found
                </h3>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-6 py-2.5 bg-[#5B6240] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#474D32] transition-colors rounded-none cursor-pointer shadow-xs"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <div
                className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 transition-opacity duration-200 ${
                  filterLoading ? "opacity-50 pointer-events-none" : "opacity-100"
                }`}
              >
                {products.map((prod) => (
                  <ProductCard
                    key={prod._id}
                    product={prod}
                    isAdded={addedProductId === prod._id}
                    onQuickAdd={handleQuickAddToCart}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Drawer (Slide-over with Backdrop) */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-4/5 max-w-sm h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Top Close Button bar */}
            <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Filter Menu
              </span>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="p-1.5 text-stone-500 hover:text-stone-900 cursor-pointer"
                aria-label="Close filters"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Content */}
            <div className="flex-1 overflow-hidden">
              {FilterContent}
            </div>

            {/* Mobile Bottom Apply Button */}
            <div className="p-4 border-t border-stone-200 bg-white">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 bg-[#5B6240] hover:bg-[#474D32] text-white text-xs font-semibold uppercase tracking-wider rounded-none cursor-pointer shadow-xs"
              >
                Show Results ({products.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
