"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { IoClose } from "react-icons/io5";
import { api } from "@/helper";

interface PromoBanner {
  _id?: string;
  title?: string;
  subtitle?: string;
  link?: string;
  buttonText?: string;
  image?: any;
  mobileImage?: any;
  status?: string;
}

export function PromoPopup() {
  const router = useRouter();
  const [banner, setBanner] = useState<PromoBanner | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isShown, setIsShown] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      sessionStorage.removeItem("eclera_promo_dismissed");
    } catch {
      // ignore
    }

    let timer: NodeJS.Timeout;

    const fetchPromo = async () => {
      try {
        const res = await api("promo-popup", undefined, "GET");
        if (res && res.status && res.data && res.data.status === "active") {
          const imgUrl =
            res.data.image?.publicUrl ||
            res.data.image?.url ||
            (typeof res.data.image === "string" ? res.data.image : null) ||
            res.data.mobileImage?.publicUrl ||
            res.data.mobileImage?.url ||
            (typeof res.data.mobileImage === "string" ? res.data.mobileImage : null);

          if (imgUrl) {
            setBanner(res.data);
            // Mount to DOM after 3 seconds delay, then smoothly slide down from top
            timer = setTimeout(() => {
              setIsMounted(true);
              requestAnimationFrame(() => {
                setTimeout(() => {
                  setIsShown(true);
                }, 50);
              });
            }, 3000);
          }
        }
      } catch (err) {
        console.error("Failed to load promo popup:", err);
      }
    };

    fetchPromo();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleClose = useCallback(() => {
    // Slide smoothly up towards top on exit, then unmount from DOM
    setIsShown(false);
    setTimeout(() => {
      setIsMounted(false);
    }, 450);
  }, []);

  // Handle escape key
  useEffect(() => {
    if (!isMounted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMounted, handleClose]);

  if (!isMounted || !banner) return null;

  const desktopImg =
    (typeof banner.image === "object"
      ? banner.image?.publicUrl || banner.image?.url
      : banner.image) || "";
  const mobileImg =
    (typeof banner.mobileImage === "object"
      ? banner.mobileImage?.publicUrl || banner.mobileImage?.url
      : banner.mobileImage) || desktopImg;
  const hasLink = Boolean(banner.link && banner.link.trim());

  const handleBannerClick = () => {
    if (hasLink && banner.link) {
      handleClose();
      router.push(banner.link.trim());
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-xs transition-opacity duration-400 ease-out ${
        isShown ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Promotional Offer"
    >
      {/* Rectangular Modal with Slide-Down From Top Animation */}
      <div
        className={`relative max-w-lg sm:max-w-xl md:max-w-2xl w-full bg-white shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
          isShown
            ? "translate-y-0 opacity-100 scale-100"
            : "-translate-y-28 opacity-0 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button overlapping right-top corner */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close promotion popup"
          className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 z-30 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-stone-900 shadow-[0_2px_10px_rgba(0,0,0,0.25)] border border-stone-200/90 flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95"
        >
          <IoClose className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Banner Content (Horizontal Landscape Rectangle without border radius) */}
        <div
          onClick={hasLink ? handleBannerClick : undefined}
          className={`relative w-full aspect-[16/10] sm:aspect-[16/9] overflow-hidden flex items-center justify-center bg-stone-100 ${
            hasLink ? "cursor-pointer group" : ""
          }`}
        >
          <picture className="w-full h-full block">
            {mobileImg && mobileImg !== desktopImg && (
              <source media="(max-width: 640px)" srcSet={mobileImg} />
            )}
            <img
              src={desktopImg}
              alt={banner.title || "Special Promotion"}
              className={`w-full h-full object-cover block transition-transform duration-500 ${
                hasLink ? "group-hover:scale-[1.02]" : ""
              }`}
            />
          </picture>

          {/* Optional bottom bar if action link exists */}
          {hasLink && (
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10">
              <span className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-[#B4395A] hover:bg-[#962a47] text-white text-xs font-semibold uppercase tracking-wider shadow-md transition-colors inline-block">
                {banner.buttonText || "Shop Offer"} &rarr;
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PromoPopup;
