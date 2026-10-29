"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FiArrowRight, FiPackage, FiChevronRight, FiImage } from "react-icons/fi";
import { api } from "@/helper";

export interface CollectionItem {
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
  products?: any[];
}

export default function CollectionsClient() {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCollections() {
      try {
        setLoading(true);
        const res = await api("collections", undefined, "GET");

        if (isMounted) {
          if (res?.status && Array.isArray(res.data)) {
            setCollections(res.data);
          } else {
            setCollections([]);
          }
        }
      } catch (err) {
        console.error("Failed to load collections:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCollections();

    return () => {
      isMounted = false;
    };
  }, []);

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
              Collections
            </span>
          </nav>
        </div>
      </div>

      {/* Header Banner */}
      <section className="bg-white border-b border-stone-200 py-10 sm:py-14 text-center">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-stone-900 tracking-tight">
            Curated Collections
          </h1>
          <div className="w-16 sm:w-20 h-[3.5px] bg-[#5B6240] rounded-none mt-3.5 sm:mt-4" />
        </div>
      </section>

      {/* Collections Grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white border border-stone-200 p-6 flex flex-col space-y-4 animate-pulse"
              >
                <div className="w-full h-44 bg-stone-100 rounded-none" />
                <div className="h-5 bg-stone-100 w-3/4 rounded-none" />
                <div className="h-3 bg-stone-100 w-1/2 rounded-none" />
                <div className="h-9 bg-stone-100 w-full mt-auto rounded-none" />
              </div>
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="bg-white border border-stone-200 py-16 px-4 text-center flex flex-col items-center justify-center shadow-xs">
            <FiPackage className="w-12 h-12 text-stone-300 stroke-[1.2] mb-3" />
            <h3 className="text-base font-semibold text-stone-800 mb-1">No collections found</h3>
            <p className="text-xs text-stone-500 max-w-sm mb-6">
              Our beauty curators are currently assembling new seasonal collections. Please explore our categories in the meantime.
            </p>
            <Link
              href="/categories"
              className="px-6 py-2.5 bg-[#5B6240] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#474D32] transition-colors rounded-none"
            >
              Browse Categories
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {collections.map((col) => {
              const imageUrl = col.image?.publicUrl || col.image?.url || "";
              const count = Array.isArray(col.products) ? col.products.length : 0;

              return (
                <div
                  key={col._id}
                  className="group flex flex-col bg-white border border-stone-200/90 rounded-none overflow-hidden transition-all duration-300 hover:border-[#5B6240] hover:shadow-lg"
                >
                  {/* Image or Banner Area */}
                  <div className="relative w-full h-48 sm:h-56 bg-[#FDFBF7] overflow-hidden flex items-center justify-center">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={col.name}
                        className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-stone-50 text-stone-400 p-6 text-center">
                        <FiImage className="w-12 h-12 text-[#5B6240]/30 stroke-[1.2] mb-2" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                          {col.name}
                        </span>
                      </div>
                    )}

                    {count > 0 && (
                      <div className="absolute top-3 right-3 z-10 bg-[#5B6240] text-white text-[11px] font-semibold tracking-wider px-2.5 py-1 uppercase rounded-none shadow-xs">
                        {count} {count === 1 ? "Product" : "Products"}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 sm:p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-semibold text-stone-900 group-hover:text-[#5B6240] transition-colors">
                      {col.name}
                    </h3>
                    <div className="w-10 h-[2.5px] bg-[#5B6240] rounded-none mt-2 mb-3" />

                    {col.description && (
                      <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed mb-4">
                        {col.description}
                      </p>
                    )}

                    <div className="mt-auto pt-4 border-t border-stone-100 flex items-center justify-between">
                      <Link
                        href={`/collections/${col.slug}`}
                        className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#5B6240] hover:text-[#474D32] transition-colors group/btn"
                      >
                        <span>Explore Collection</span>
                        <FiArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
