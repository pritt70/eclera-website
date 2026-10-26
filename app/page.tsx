import React from "react";
import { HeroBanner } from "@/components/HeroBanner";
import { CategorySection } from "@/components/CategorySection";
import { CollectionSections } from "@/components/CollectionSections";
import { MarketplaceSection } from "@/components/MarketplaceSection";
import { SocialSection } from "@/components/SocialSection";

export default function WebsiteHome() {
  return (
    <main className="min-h-screen bg-white">
      {/* Dynamic Responsive Hero Section */}
      <HeroBanner />

      {/* Circular Category Slider with Autoscroll */}
      <CategorySection />

      {/* Dedicated Section: Products Available on Flipkart & Meesho */}
      <MarketplaceSection />

      {/* Admin Panel Collections with Prominent Product Card Sliders */}
      <CollectionSections />

      {/* Dynamic Social Media Community & Autoplay Video Reels Swiper */}
      <SocialSection />
    </main>
  );
}

