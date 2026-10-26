import React from "react";
import type { Metadata } from "next";
import CategoriesClient from "./CategoriesClient";

export const metadata: Metadata = {
  title: "Shop by Category | Eclera Cosmetics",
  description:
    "Explore our complete range of dermatologically tested, clean, cruelty-free cosmetic and skincare formulations categorized for your daily beauty rituals.",
};

export default function CategoriesPage() {
  return <CategoriesClient />;
}
