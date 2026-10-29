import React from "react";
import type { Metadata } from "next";
import CollectionsClient from "./CollectionsClient";

export const metadata: Metadata = {
  title: "Curated Collections | Eclera Cosmetics",
  description:
    "Explore our exclusive beauty and skincare collections. Each ritual is thoughtfully curated with dermatologically formulated essentials for healthy, radiant skin.",
};

export default function CollectionsPage() {
  return <CollectionsClient />;
}
