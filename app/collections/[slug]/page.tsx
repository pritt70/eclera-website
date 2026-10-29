import React from "react";
import type { Metadata } from "next";
import CollectionProductsClient from "./CollectionProductsClient";

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
    : "Collection";

  return {
    title: `${formatted} Collection | Eclera Cosmetics`,
    description: `Explore the luxury ${formatted} collection from Eclera. Formulated with pure botanical extracts and dermatologically tested actives for radiant skin.`,
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  return <CollectionProductsClient slug={slug} />;
}
