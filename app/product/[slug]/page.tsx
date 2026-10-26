import React from "react";
import type { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";
import { api } from "@/helper";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await api(`product/${slug}`, undefined, "GET");
    if (res?.status && res.data) {
      const product = res.data;
      return {
        title: product.seoTitle || `${product.name} | Eclera Cosmetics`,
        description:
          product.seoDescription ||
          `Buy ${product.name} online at Eclera. Clean, dermatologically tested luxury skincare formulated for Indian skin.`,
      };
    }
  } catch (err) {
    console.error("Metadata error:", err);
  }

  const formatted = slug
    ? slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "Product";

  return {
    title: `${formatted} | Eclera Cosmetics`,
    description: `Shop luxury skincare formulations at Eclera.`,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  return <ProductDetailClient slug={slug} />;
}
