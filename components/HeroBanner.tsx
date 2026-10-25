"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

// Swiper core CSS
import "swiper/css";

import { api } from "@/helper";

export interface BannerItem {
  _id?: string;
  title?: string;
  subtitle?: string;
  image: {
    url?: string;
    publicUrl?: string;
    key?: string;
  };
  mobileImage?: {
    url?: string;
    publicUrl?: string;
    key?: string;
  };
  link?: string;
  buttonText?: string;
  position?: string;
  status?: string;
}

interface BannerSlideProps {
  banner: BannerItem;
  router: ReturnType<typeof useRouter>;
}

function BannerSlide({ banner, router }: BannerSlideProps) {
  const redirectUrl =
    banner.link && typeof banner.link === "string" && banner.link.trim() !== ""
      ? banner.link.trim()
      : null;

  const isClickable = Boolean(redirectUrl);

  const handleClick = () => {
    if (!redirectUrl) return;

    if (redirectUrl.startsWith("http://") || redirectUrl.startsWith("https://")) {
      window.open(redirectUrl, "_blank", "noopener,noreferrer");
    } else {
      router.push(redirectUrl);
    }
  };

  const desktopImg = banner.image?.url || banner.image?.publicUrl || "";
  const mobileImg = banner.mobileImage?.url || banner.mobileImage?.publicUrl || desktopImg;

  return (
    <div
      onClick={isClickable ? handleClick : undefined}
      className={`relative w-full h-full overflow-hidden select-none ${
        isClickable ? "cursor-pointer group" : "cursor-default"
      }`}
      role={isClickable ? "link" : "presentation"}
      tabIndex={isClickable ? 0 : -1}
      aria-label={isClickable ? `Banner link to ${redirectUrl}` : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <picture className="w-full h-full block">
        {mobileImg && mobileImg !== desktopImg && (
          <source media="(max-width: 640px)" srcSet={mobileImg} />
        )}
        <img
          src={desktopImg}
          alt={banner.title || "Eclera Cosmetics"}
          className={`w-full h-full object-cover object-center block ${
            isClickable ? "transition-transform duration-700 group-hover:scale-[1.008]" : ""
          }`}
          loading="eager"
        />
      </picture>
    </div>
  );
}

export function HeroBanner() {
  const router = useRouter();
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch active banners from API
    api("banners", undefined, "GET")
      .then((res) => {
        if (res && res.status && Array.isArray(res.data) && res.data.length > 0) {
          // Filter active home_hero banners
          const heroBanners = res.data.filter(
            (b: BannerItem) => !b.position || b.position === "home_hero"
          );
          setBanners(heroBanners.length > 0 ? heroBanners : res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch hero banners:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Full-bleed responsive height container: lower and balanced on mobile
  const containerClasses =
    "relative w-full h-[220px] sm:h-[340px] md:h-[460px] lg:h-[calc(100dvh-112px)] lg:max-h-[820px] overflow-hidden bg-[#EFF3E8]";

  // Loading skeleton placeholder
  if (loading) {
    return (
      <section className={containerClasses}>
        <div className="w-full h-full bg-stone-100 animate-pulse flex items-center justify-center">
          <div className="h-6 w-28 bg-stone-200/80 rounded" />
        </div>
      </section>
    );
  }

  // If no banners returned
  if (banners.length === 0) {
    return null;
  }

  // Condition 1: If MORE than 1 image -> Render Swiper Slider in full-bleed height
  if (banners.length > 1) {
    return (
      <section className={containerClasses} aria-label="Hero Slider">
        <Swiper
          modules={[Autoplay]}
          autoplay={{
            delay: 4500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          loop={true}
          speed={650}
          className="w-full h-full"
        >
          {banners.map((banner, index) => (
            <SwiperSlide key={banner._id || index} className="w-full h-full">
              <BannerSlide banner={banner} router={router} />
            </SwiperSlide>
          ))}
        </Swiper>
      </section>
    );
  }

  // Condition 2: If ONLY 1 image -> Render single static image in full-bleed height
  return (
    <section className={containerClasses} aria-label="Hero Banner">
      <BannerSlide banner={banners[0]} router={router} />
    </section>
  );
}
