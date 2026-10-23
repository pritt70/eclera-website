import React from "react";
import { HeroBanner } from "@/components/HeroBanner";

export default function WebsiteHome() {
  return (
    <main className="min-h-screen bg-white">
      {/* Dynamic Responsive Hero Section */}
      <HeroBanner />
    </main>
  );
}
