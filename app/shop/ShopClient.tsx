"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FiFilter,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiCheck,
  FiLoader,
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
  collections?: any[];
  rating?: number;
  reviewsCount?: number;
  description?: string;
  status?: string;
  sortOrder?: number;
  flipkartUrl?: string;
  specifications?: any[];
}

interface FilterOption {
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

const PAGE_SIZE = 6; // Divisible by 2 (mobile grid) and 3 (desktop grid) for smooth infinite scroll

export default function ShopClient() {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [totalProducts, setTotalProducts] = useState<number>(0);

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

  // Mobile Drawer state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter States
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [minBound, setMinBound] = useState<number>(0);
  const [maxBound, setMaxBound] = useState<number>(5000);

  // Filter Metadata from Backend
  const [availableCategories, setAvailableCategories] = useState<FilterOption[]>([]);
  const [availableCollections, setAvailableCollections] = useState<FilterOption[]>([]);
  const [availableSpecifications, setAvailableSpecifications] = useState<SpecItem[]>([]);

  // Collapsible filter sections (all expanded by default)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    price: true,
    categories: true,
    collections: true,
  });

  const toggleSection = (sec: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sec]: !prev[sec],
    }));
  };

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

  // Track whether initial baseline load has completed
  const isInitialLoadedRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load: Fetch Banners, Baseline Shop Data & Filter Metadata
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        setInitialLoading(true);

        const shopRes = await api(`shop?page=1&limit=${PAGE_SIZE}`, undefined, "GET");

        if (!isMounted) return;

        if (shopRes?.status && shopRes.data) {
          const fetchedProducts = Array.isArray(shopRes.data.products) ? shopRes.data.products : [];
          setProducts(fetchedProducts);

          if (shopRes.data.pagination) {
            setCurrentPage(shopRes.data.pagination.page || 1);
            setHasNextPage(Boolean(shopRes.data.pagination.hasNextPage));
            setTotalProducts(shopRes.data.pagination.totalProducts || fetchedProducts.length);
          }

          // Use filterMeta from backend
          if (shopRes.data.filterMeta) {
            const fm = shopRes.data.filterMeta;
            const bMin = typeof fm.minPrice === "number" ? fm.minPrice : 0;
            const bMax = typeof fm.maxPrice === "number" ? fm.maxPrice : 5000;
            setMinBound(bMin);
            setMaxBound(bMax);
            setPriceRange([bMin, bMax]);

            if (Array.isArray(fm.categories)) {
              setAvailableCategories(fm.categories);
            }
            if (Array.isArray(fm.collections)) {
              setAvailableCollections(fm.collections);
            }
            if (Array.isArray(fm.specifications)) {
              setAvailableSpecifications(fm.specifications);
            }
          }

          // Initialize filters from URL query parameters if present
          const initialCategory = searchParams.get("category");
          const initialCollection = searchParams.get("collection");
          if (initialCategory) {
            setSelectedCategories([initialCategory]);
          }
          if (initialCollection) {
            setSelectedCollections([initialCollection]);
          }
        }

        isInitialLoadedRef.current = true;
      } catch (err) {
        console.error("Failed to load initial shop data:", err);
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
  }, [searchParams]);

  // 2. Fetch Filtered Products (Resets pagination to Page 1)
  const fetchFilteredProducts = useCallback(
    async (
      currentPriceRange: [number, number],
      currentCategories: string[],
      currentCollections: string[],
      currentOptions: string[],
      currentSort: string
    ) => {
      try {
        setFilterLoading(true);

        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("limit", String(PAGE_SIZE));
        params.set("minPrice", String(currentPriceRange[0]));
        params.set("maxPrice", String(currentPriceRange[1]));

        if (currentCategories.length > 0) {
          params.set("categories", currentCategories.join(","));
        }
        if (currentCollections.length > 0) {
          params.set("collections", currentCollections.join(","));
        }
        if (currentOptions.length > 0) {
          params.set("options", currentOptions.join(","));
        }
        if (currentSort) {
          params.set("sortBy", currentSort);
        }

        const endpoint = `shop?${params.toString()}`;
        const res = await api(endpoint, undefined, "GET");

        if (res?.status && res.data) {
          const fetchedProducts = Array.isArray(res.data.products) ? res.data.products : [];
          setProducts(fetchedProducts);
          setCurrentPage(1);

          if (res.data.pagination) {
            setHasNextPage(Boolean(res.data.pagination.hasNextPage));
            setTotalProducts(res.data.pagination.totalProducts || fetchedProducts.length);
          } else {
            setHasNextPage(false);
            setTotalProducts(fetchedProducts.length);
          }
        } else {
          setProducts([]);
          setCurrentPage(1);
          setHasNextPage(false);
          setTotalProducts(0);
        }
      } catch (err) {
        console.error("Error fetching filtered products from database:", err);
        setProducts([]);
      } finally {
        setFilterLoading(false);
      }
    },
    []
  );

  // 3. Trigger API call whenever any filter or sorting changes (debounced for smooth slider)
  useEffect(() => {
    if (!isInitialLoadedRef.current) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchFilteredProducts(
        priceRange,
        selectedCategories,
        selectedCollections,
        selectedOptions,
        sortBy
      );
    }, 280);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    priceRange,
    selectedCategories,
    selectedCollections,
    selectedOptions,
    sortBy,
    fetchFilteredProducts,
  ]);

  // 4. Infinite Scroll: Fetch Next Page of Products
  const loadMoreProducts = useCallback(async () => {
    if (loadingMore || filterLoading || initialLoading || !hasNextPage) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;

      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("limit", String(PAGE_SIZE));
      params.set("minPrice", String(priceRange[0]));
      params.set("maxPrice", String(priceRange[1]));

      if (selectedCategories.length > 0) {
        params.set("categories", selectedCategories.join(","));
      }
      if (selectedCollections.length > 0) {
        params.set("collections", selectedCollections.join(","));
      }
      if (selectedOptions.length > 0) {
        params.set("options", selectedOptions.join(","));
      }
      if (sortBy) {
        params.set("sortBy", sortBy);
      }

      const endpoint = `shop?${params.toString()}`;
      const res = await api(endpoint, undefined, "GET");

      if (res?.status && res.data) {
        const nextBatch = Array.isArray(res.data.products) ? res.data.products : [];

        setProducts((prev) => {
          // Avoid appending duplicates by comparing _id
          const existingIds = new Set(prev.map((p) => p._id));
          const uniqueBatch = nextBatch.filter((p: Product) => !existingIds.has(p._id));
          return [...prev, ...uniqueBatch];
        });

        setCurrentPage(nextPage);

        if (res.data.pagination) {
          setHasNextPage(Boolean(res.data.pagination.hasNextPage));
          setTotalProducts(res.data.pagination.totalProducts || 0);
        } else {
          setHasNextPage(false);
        }
      } else {
        setHasNextPage(false);
      }
    } catch (err) {
      console.error("Error loading next page of products:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [
    currentPage,
    hasNextPage,
    loadingMore,
    filterLoading,
    initialLoading,
    priceRange,
    selectedCategories,
    selectedCollections,
    selectedOptions,
    sortBy,
  ]);

  // IntersectionObserver to trigger infinite scroll as user scrolls down
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasNextPage && !loadingMore && !filterLoading && !initialLoading) {
          loadMoreProducts();
        }
      },
      {
        root: null,
        rootMargin: "300px", // Trigger slightly before reaching the absolute bottom
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [loadMoreProducts, hasNextPage, loadingMore, filterLoading, initialLoading]);

  // Handle Category selection
  const handleToggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  // Handle Collection selection
  const handleToggleCollection = (colId: string) => {
    setSelectedCollections((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
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
    setSelectedCollections([]);
    setSelectedOptions([]);
  };

  // Check if any filter is active
  const isFilterActive = useMemo(() => {
    const priceChanged =
      priceRange[0] > minBound || priceRange[1] < maxBound;
    return (
      priceChanged ||
      selectedCategories.length > 0 ||
      selectedCollections.length > 0 ||
      selectedOptions.length > 0
    );
  }, [priceRange, minBound, maxBound, selectedCategories, selectedCollections, selectedOptions]);

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
                  const checked = selectedCategories.includes(cat.id) || (cat.slug ? selectedCategories.includes(cat.slug) : false);
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

        {/* 3. Collections Filter (Checkboxes) */}
        {availableCollections.length > 0 && (
          <div className="space-y-3 pb-5 border-b border-stone-200/80">
            <button
              type="button"
              onClick={() => toggleSection("collections")}
              className="w-full flex items-center justify-between text-left group cursor-pointer"
            >
              <span className="text-xs font-semibold text-stone-800 uppercase tracking-wider">
                Collections
              </span>
              <FiChevronDown
                className={`w-4 h-4 text-stone-500 transition-transform duration-200 ${
                  expandedSections.collections ? "rotate-180" : ""
                }`}
              />
            </button>

            {expandedSections.collections && (
              <div className="space-y-2 pt-1 max-h-48 overflow-y-auto pr-1">
                {availableCollections.map((col) => {
                  const checked = selectedCollections.includes(col.id) || (col.slug ? selectedCollections.includes(col.slug) : false);
                  return (
                    <label
                      key={col.id}
                      className="flex items-center justify-between text-xs text-stone-700 hover:text-stone-900 cursor-pointer select-none py-1 group/item"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleCollection(col.id)}
                          className="w-3.5 h-3.5 rounded-none text-[#5B6240] border-stone-300 focus:ring-[#5B6240] cursor-pointer"
                        />
                        <span className={`transition-colors ${checked ? "font-semibold text-[#5B6240]" : ""}`}>
                          {col.name}
                        </span>
                      </div>
                      {typeof col.count === "number" && (
                        <span className="text-[11px] text-stone-400">
                          ({col.count})
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. Specifications Filters (Options Checkboxes grouped by Specification) */}
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
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-stone-500 font-medium">
            <Link href="/" className="hover:text-[#5B6240] transition-colors">
              Home
            </Link>
            <FiChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="text-stone-900 font-semibold uppercase tracking-wider text-[11px]">
              Shop
            </span>
          </nav>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Title Header with Signature Accent Bar */}
        <div className="mb-6 sm:mb-8 pb-4 border-b border-stone-200/80">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-stone-900 tracking-tight">
            Shop All Products
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
            {/* Header above product list */}
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

                {/* Left Side: "Products" title + count badge */}
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-semibold text-stone-900 tracking-tight">
                    Products
                  </h2>
                  <span className="text-xs text-stone-500 font-medium">
                    ({totalProducts})
                  </span>
                </div>
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
              /* No products found state */
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
              <div className="space-y-6">
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

                {/* Loading More Spinner / Skeleton row */}
                {loadingMore && (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 pt-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={`more-skeleton-${i}`}
                        className="bg-white border border-stone-200 p-3 flex flex-col space-y-3 animate-pulse"
                      >
                        <div className="w-full aspect-square bg-stone-100" />
                        <div className="h-4 bg-stone-100 w-3/4 rounded-none" />
                        <div className="h-3 bg-stone-100 w-1/2 rounded-none" />
                        <div className="h-8 bg-stone-100 w-full mt-auto rounded-none" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Infinite Scroll Sentinel */}
                <div ref={sentinelRef} className="h-10 w-full flex items-center justify-center">
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-xs font-medium text-stone-500 py-2">
                      <FiLoader className="w-4 h-4 animate-spin text-[#5B6240]" />
                      <span>Loading more products...</span>
                    </div>
                  )}
                </div>

                {/* End of list message */}
                {!hasNextPage && products.length > 0 && !loadingMore && (
                  <div className="text-center py-6 border-t border-stone-200/60 mt-4">
                    <p className="text-xs text-stone-400 uppercase tracking-widest font-medium">
                      You have viewed all {products.length} products
                    </p>
                  </div>
                )}
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
