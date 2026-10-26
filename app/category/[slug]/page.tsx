import React from "react";
import type { Metadata } from "next";
import CategoryProductsClient from "./CategoryProductsClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const formatted = slug
    ? slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "Category";

  return {
    title: `${formatted} | Eclera Cosmetics`,
    description: `Shop luxury, dermatologically tested ${formatted} from Eclera. Clean skincare rituals formulated for radiant Indian skin.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  return <CategoryProductsClient slug={slug} />;
}
