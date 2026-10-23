"use client";

import React, { useState, useEffect } from "react";

const ANNOUNCEMENTS = [
  "Free Shipping on all orders above ₹499 across India — Use code ECLERA10 for 10% Off",
  "100% Vegan, Clean & Dermatologically Tested Formulations",
  "Complimentary Luxury Skincare Sample with every order",
];

export function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-[#181615] text-stone-200 text-xs font-medium tracking-wide border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-center text-center">
        <p className="truncate transition-opacity duration-300">
          {ANNOUNCEMENTS[currentIndex]}
        </p>
      </div>
    </div>
  );
}
