"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  RiFacebookFill,
  RiInstagramLine,
  RiThreadsFill,
  RiYoutubeFill,
} from "react-icons/ri";
import { api } from "@/helper";

interface PolicyItem {
  _id?: string;
  title: string;
  slug: string;
}

interface CategoryItem {
  _id?: string;
  name: string;
  slug: string;
}

interface CollectionItem {
  _id?: string;
  name: string;
  slug: string;
}

export function Footer() {
  const [policies, setPolicies] = useState<PolicyItem[]>([
    { title: "Shipping Policy", slug: "shipping-policy" },
    { title: "Return & Refund Policy", slug: "return-policy" },
    { title: "Terms & Conditions", slug: "terms-and-conditions" },
    { title: "Privacy Policy", slug: "privacy-policy" },
  ]);

  const [categories, setCategories] = useState<CategoryItem[]>([
    { name: "Serums & Face Oils", slug: "serums-oils" },
    { name: "Moisturizers & Creams", slug: "moisturizers-creams" },
    { name: "Cleansers & Toners", slug: "cleansers-toners" },
    { name: "Face Masks & Scrubs", slug: "face-masks-scrubs" },
    { name: "Eye & Lip Care", slug: "eye-lip-care" },
  ]);

  const [collections, setCollections] = useState<CollectionItem[]>([
    { name: "Bestsellers", slug: "bestsellers" },
    { name: "New Launches", slug: "new-launches" },
    { name: "Trending Skincare", slug: "trending-skincare" },
    { name: "Hydrating Essentials", slug: "hydrating-essentials" },
    { name: "Clean & Vegan", slug: "clean-vegan" },
  ]);

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "Collections", href: "/collections" },
    { name: "Shop", href: "/shop" },
    { name: "About Us", href: "/about" },
    { name: "Contact Us", href: "/contact" },
  ];

  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch live policies from Admin module
    api("policies", undefined, "GET")
      .then((res) => {
        if (res && res.status && Array.isArray(res.data) && res.data.length > 0) {
          setPolicies(res.data);
        }
      })
      .catch(() => {});

    // Fetch live categories from Admin module
    api("categories", undefined, "GET")
      .then((res) => {
        if (res && res.status && Array.isArray(res.data) && res.data.length > 0) {
          setCategories(res.data);
        }
      })
      .catch(() => {});

    // Fetch live collections from Admin module
    api("collections", undefined, "GET")
      .then((res) => {
        if (res && res.status && Array.isArray(res.data) && res.data.length > 0) {
          setCollections(res.data);
        }
      })
      .catch(() => {});

    // Fetch live dynamic social media links
    api("social", undefined, "GET")
      .then((res) => {
        if (res && res.status && res.data?.links) {
          setSocialLinks(res.data.links);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-[#FAF9F5] text-stone-800 font-sans border-t border-stone-200/80">
      {/* Main Footer Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-8">
          {/* Column 1: Brand Info & Social Media */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <img
                src="/assets/images/eclera-logo.svg"
                alt="Eclera Cosmetics"
                className="h-9 w-auto object-contain"
              />
            </Link>

            <p className="text-xs text-stone-600 leading-relaxed">
              Clean, vegan, and dermatologically tested luxury skincare and cosmetics formulations designed for your everyday glow.
            </p>

            {/* Dynamic Social Media icons under brand info - strictly limited to 4: Instagram, Facebook, Threads, YouTube (only rendered if link is configured) */}
            {(() => {
              const footerChannels = [
                {
                  key: "instagram",
                  label: "Instagram",
                  icon: <RiInstagramLine className="w-3.5 h-3.5" />,
                },
                {
                  key: "facebook",
                  label: "Facebook",
                  icon: <RiFacebookFill className="w-3.5 h-3.5" />,
                },
                {
                  key: "thread",
                  label: "Threads",
                  icon: <RiThreadsFill className="w-3.5 h-3.5" />,
                },
                {
                  key: "youtube",
                  label: "YouTube",
                  icon: <RiYoutubeFill className="w-3.5 h-3.5" />,
                },
              ].filter((item) => Boolean(socialLinks[item.key] && socialLinks[item.key].trim()));

              if (footerChannels.length === 0) return null;

              return (
                <div className="flex items-center gap-2.5 pt-2 text-stone-700">
                  {footerChannels.map((item) => (
                    <a
                      key={item.key}
                      href={socialLinks[item.key]}
                      target="_blank"
                      rel="noreferrer"
                      className="h-8 w-8 rounded-full bg-white border border-stone-200 hover:bg-[#5B6240] hover:border-[#5B6240] hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs"
                      aria-label={item.label}
                    >
                      {item.icon}
                    </a>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Column 2: QUICK LINKS */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-stone-900 tracking-[0.2em] uppercase">
              QUICK LINKS
            </h4>
            <ul className="space-y-2 text-xs">
              {quickLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-stone-600 hover:text-[#5B6240] transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: CATEGORIES */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-stone-900 tracking-[0.2em] uppercase">
              CATEGORIES
            </h4>
            <ul className="space-y-2 text-xs">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat._id || cat.slug}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="text-stone-600 hover:text-[#5B6240] transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: COLLECTIONS */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-stone-900 tracking-[0.2em] uppercase">
              COLLECTIONS
            </h4>
            <ul className="space-y-2 text-xs">
              {collections.slice(0, 6).map((col) => (
                <li key={col._id || col.slug}>
                  <Link
                    href={`/collections/${col.slug}`}
                    className="text-stone-600 hover:text-[#5B6240] transition-colors"
                  >
                    {col.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: OUR POLICIES */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-stone-900 tracking-[0.2em] uppercase">
              OUR POLICIES
            </h4>
            <ul className="space-y-2 text-xs">
              {policies.map((p) => (
                <li key={p._id || p.slug}>
                  <Link
                    href={`/policies/${p.slug}`}
                    className="text-stone-600 hover:text-[#5B6240] transition-colors"
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar: ONLY Centered Copyright Text */}
      <div className="border-t border-stone-200/80 py-5">
        <div className="max-w-[1400px] mx-auto px-4 text-center">
          <p className="text-xs text-stone-500">
            Copyright © 2026 Eclera Cosmetics. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
