"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  FiChevronRight,
  FiChevronDown,
  FiShoppingBag,
  FiCheck,
  FiStar,
  FiArrowLeft,
  FiSliders,
  FiPackage,
  FiImage,
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
  };
  rating?: number;
  reviewsCount?: number;
  description?: string;
  status?: string;
  sortOrder?: number;
  flipkartUrl?: string;
}

interface CategoryInfo {
  _id: string;
  name: string;
  slug: string;
  image?: {
    url?: string;
    publicUrl?: string;
  };
  description?: string;
}

export default function CategoryProductsClient({ slug }: { slug: string }) {
  const [category, setCategory] = useState<CategoryInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
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

  useEffect(() => {
    let isMounted = true;

    async function loadCategoryAndProducts() {
      try {
        setLoading(true);
        // Load categories list to find current category metadata
        const catRes = await api("categories", undefined, "GET");
        let matchedCat: CategoryInfo | null = null;
        if (catRes?.status && Array.isArray(catRes.data)) {
          matchedCat = catRes.data.find(
            (c: any) => c.slug?.toLowerCase() === slug.toLowerCase() || c._id === slug
          );
        }

        // Fetch products for this category
        const prodRes = await api(`products?category=${slug}`, undefined, "GET");

        if (isMounted) {
          if (matchedCat) {
            setCategory(matchedCat);
          } else {
            // Fallback category representation from slug
            const formattedName = slug
              .split("-")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");
            setCategory({
              _id: slug,
              name: formattedName,
              slug,
            });
          }

          if (prodRes?.status && Array.isArray(prodRes.data)) {
            setProducts(prodRes.data);
          } else {
            setProducts([]);
          }
        }
      } catch (err) {
        console.error("Failed to load category products:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCategoryAndProducts();

    return () => {
      isMounted = false;
    };
  }, [slug]);

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

  // Sort products
  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }
    return list;
  }, [products, sortBy]);

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
            <Link href="/categories" className="hover:text-[#5B6240] transition-colors">
              Categories
            </Link>
            <FiChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="text-stone-900 font-semibold uppercase tracking-wider text-[11px] truncate max-w-[200px]">
              {category?.name || slug}
            </span>
          </nav>
        </div>
      </div>

      {/* Header Banner */}
      <section className="bg-white border-b border-stone-200 py-10 sm:py-12 md:py-14">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-[#5B6240] mb-3 transition-colors"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>All Categories</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-stone-900 tracking-tight">
            {category?.name || "Category Products"}
          </h1>
          <div className="w-16 sm:w-20 h-[3.5px] bg-[#5B6240] rounded-full mt-3.5 sm:mt-4" />
        </div>
      </section>

      {/* Control Bar: Count & Sorting */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="bg-white border border-stone-200 p-4 sm:p-5 flex items-center justify-between gap-4 shadow-2xs">
          <div className="text-xs text-stone-600 font-medium">
            Showing <strong className="text-stone-900">{sortedProducts.length}</strong>{" "}
            {sortedProducts.length === 1 ? "Product" : "Products"}
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
      </div>

      {/* Products Grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white border border-stone-200 p-4 animate-pulse space-y-4">
                <div className="aspect-square bg-stone-100" />
                <div className="h-4 bg-stone-100 w-3/4" />
                <div className="h-4 bg-stone-100 w-1/2" />
                <div className="h-9 bg-stone-100" />
              </div>
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="bg-white border border-stone-200 py-16 px-6 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-[#F1F3EC] rounded-full flex items-center justify-center text-[#5B6240] mb-4">
              <FiPackage className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900 mb-1">
              No Products In This Category Yet
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 max-w-sm mb-5">
              New formulations are currently being prepared. Explore our other categories or check back soon!
            </p>
            <Link
              href="/categories"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5B6240] hover:bg-[#474D32] text-white text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span>Browse All Categories</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {sortedProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                isAdded={addedProductId === product._id}
                onQuickAdd={handleQuickAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
