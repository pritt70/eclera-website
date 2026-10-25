import React from "react";
import { HeroBanner } from "@/components/HeroBanner";
import { CategorySection } from "@/components/CategorySection";
import { CollectionSections } from "@/components/CollectionSections";

export default function WebsiteHome() {
  return (
    <main className="min-h-screen bg-white">
      {/* Dynamic Responsive Hero Section */}
      <HeroBanner />

      {/* Circular Category Slider with Autoscroll */}
      <CategorySection />

      {/* Admin Panel Collections with Prominent Product Card Sliders */}
      <CollectionSections />
    </main>
  );
}
