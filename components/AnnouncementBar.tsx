"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/helper";

export interface AnnouncementItem {
  _id?: string;
  text: string;
  link?: string;
}

export function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch live active announcements from Admin Panel API
  useEffect(() => {
    let isMounted = true;

    async function loadAnnouncements() {
      try {
        const res = await api("announcements", undefined, "GET");
        if (isMounted && res && res.status && Array.isArray(res.data) && res.data.length > 0) {
          const validItems = res.data.filter(
            (item: any) => item && typeof item.text === "string" && item.text.trim() !== ""
          );
          setAnnouncements(validItems);
        } else if (isMounted) {
          setAnnouncements([]);
        }
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
        if (isMounted) setAnnouncements([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAnnouncements();

    return () => {
      isMounted = false;
    };
  }, []);

  // Rotate between announcements if more than 1
  useEffect(() => {
    if (announcements.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [announcements.length]);

  // If loading or no announcements added in admin panel, remove announcement bar completely
  if (loading || announcements.length === 0) {
    return null;
  }

  const current = announcements[currentIndex];
  if (!current) return null;

  const hasLink = Boolean(current.link && current.link.trim() !== "");
  const isExternal =
    hasLink &&
    (current.link!.startsWith("http://") || current.link!.startsWith("https://"));

  return (
    <div className="bg-[#181615] text-stone-200 text-xs font-medium tracking-wide border-b border-stone-800 transition-all">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-center text-center">
        {hasLink ? (
          isExternal ? (
            <a
              href={current.link}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:text-white hover:underline transition-colors duration-200"
            >
              {current.text}
            </a>
          ) : (
            <Link
              href={current.link!}
              className="truncate hover:text-white hover:underline transition-colors duration-200"
            >
              {current.text}
            </Link>
          )
        ) : (
          <p className="truncate transition-opacity duration-300">
            {current.text}
          </p>
        )}
      </div>
    </div>
  );
}
