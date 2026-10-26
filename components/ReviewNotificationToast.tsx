"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { FiStar, FiX, FiCheckCircle } from "react-icons/fi";
import { api } from "@/helper";

interface ReviewNotification {
  _id: string;
  name: string;
  country?: string;
  rating: number;
  message: string;
  productName: string;
  productSlug: string;
  productImage?: string;
  createdAt?: string;
  isInstantUserSubmission?: boolean;
}

// 10 Curated Harmonious Brand Palette Colors for Alphabet-based Avatars
const AVATAR_PALETTE = [
  "#5B6240", // 0: Eclera Signature Olive / Moss
  "#A75D43", // 1: Rich Terracotta
  "#2C3E50", // 2: Midnight Indigo
  "#6D597A", // 3: Warm Plum
  "#B56576", // 4: Dusty Rose
  "#2A9D8F", // 5: Coastal Sage
  "#9C6644", // 6: Deep Mocha
  "#B8860B", // 7: Antique Ochre / Gold
  "#4A5568", // 8: Slate Mineral
  "#7B4B3A", // 9: Burnt Sienna
];

// Helper to determine the avatar background color based on alphabet
function getAvatarBgColor(name: string): string {
  if (!name || !name.trim()) return AVATAR_PALETTE[0];
  const firstChar = name.trim().toUpperCase()[0];
  const charCode = firstChar.charCodeAt(0);
  // Loop through 10 colors based on alphabet (A=0, B=1, ... Z=25)
  const index = Math.abs((charCode - 65) % AVATAR_PALETTE.length);
  return AVATAR_PALETTE[index] || AVATAR_PALETTE[0];
}

export default function ReviewNotificationToast() {
  const [reviews, setReviews] = useState<ReviewNotification[]>([]);
  const [currentReview, setCurrentReview] = useState<ReviewNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const reviewsRef = useRef<ReviewNotification[]>([]);
  const currentIndexRef = useRef(0);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nextTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep ref synchronized
  useEffect(() => {
    reviewsRef.current = reviews;
  }, [reviews]);

  // Display the next review from the queue
  const showNextReview = useCallback(() => {
    const list = reviewsRef.current;
    if (!list || list.length === 0) return;

    // Pick next review in sequence or random if list has items
    const nextIdx = (currentIndexRef.current + 1) % list.length;
    currentIndexRef.current = nextIdx;
    const reviewToShow = list[nextIdx];

    if (!reviewToShow) return;

    setCurrentReview(reviewToShow);
    setIsVisible(true);

    // Auto hide after 6 seconds
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);

      // Wait random interval between minimum 1 second and maximum 5 seconds
      const randomInterval = 1000 + Math.floor(Math.random() * 4000);
      if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
      nextTimerRef.current = setTimeout(() => {
        showNextReview();
      }, randomInterval);
    }, 6000);
  }, []);

  // Dismiss current notification cleanly
  const dismissCurrent = useCallback(() => {
    setIsVisible(false);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (nextTimerRef.current) clearTimeout(nextTimerRef.current);

    // Schedule next notification: random between minimum 1s and maximum 5s
    const randomDelay = 1000 + Math.floor(Math.random() * 4000);
    nextTimerRef.current = setTimeout(() => {
      showNextReview();
    }, randomDelay);
  }, [showNextReview]);

  // Instant notification trigger for user-submitted reviews (logged in or guest)
  const triggerInstantReview = useCallback((newReview: ReviewNotification) => {
    if (!newReview) return;

    // Clear any active timers
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (nextTimerRef.current) clearTimeout(nextTimerRef.current);

    // Prepend to reviews list
    setReviews((prev) => {
      const filtered = prev.filter((r) => r._id !== newReview._id);
      return [newReview, ...filtered];
    });

    // Make sure it starts from bottom and slides up smoothly
    setIsVisible(false);
    setTimeout(() => {
      setCurrentReview({ ...newReview, isInstantUserSubmission: true });
      setIsVisible(true);
    }, 80);

    // Keep visible for 7 seconds
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);

      // Resume regular rotation after random interval (1 to 5 seconds)
      const randomInterval = 1000 + Math.floor(Math.random() * 4000);
      nextTimerRef.current = setTimeout(() => {
        showNextReview();
      }, randomInterval);
    }, 7000);
  }, [showNextReview]);

  // Load real reviews across all products from API strictly from database
  useEffect(() => {
    let isMounted = true;

    async function fetchAllReviews() {
      try {
        const res = await api("reviews/all", undefined, "GET");
        if (isMounted && res?.status && Array.isArray(res.data) && res.data.length > 0) {
          setReviews(res.data);
          reviewsRef.current = res.data;

          // Start the initial notification after 1.2s, then random 1-5s for subsequent
          const initialDelay = 1200;
          nextTimerRef.current = setTimeout(() => {
            if (isMounted) {
              const firstReview = res.data[0];
              currentIndexRef.current = 0;
              setCurrentReview(firstReview);
              setIsVisible(true);

              hideTimerRef.current = setTimeout(() => {
                if (isMounted) {
                  setIsVisible(false);
                  const randomInterval = 1000 + Math.floor(Math.random() * 4000);
                  nextTimerRef.current = setTimeout(() => {
                    if (isMounted) showNextReview();
                  }, randomInterval);
                }
              }, 6000);
            }
          }, initialDelay);
        }
      } catch (err) {
        console.error("Failed to load global reviews for notification:", err);
      }
    }

    fetchAllReviews();

    return () => {
      isMounted = false;
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
    };
  }, [showNextReview]);

  // Listen for instant new review submissions from anywhere across the application
  useEffect(() => {
    const handleNewReviewEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ReviewNotification>;
      if (customEvent.detail) {
        triggerInstantReview(customEvent.detail);
      }
    };

    window.addEventListener("eclera_new_review", handleNewReviewEvent);
    return () => {
      window.removeEventListener("eclera_new_review", handleNewReviewEvent);
    };
  }, [triggerInstantReview]);

  if (!currentReview) return null;

  const firstLetter = (currentReview.name || "C").trim().toUpperCase()[0] || "C";
  const avatarBg = getAvatarBgColor(currentReview.name);
  const ratingStars = Math.max(1, Math.min(5, Math.round(currentReview.rating || 5)));

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 w-[calc(100vw-32px)] sm:w-[380px] max-w-[380px] bg-white border border-stone-200 shadow-2xl transition-all duration-500 ease-out transform ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
          : "opacity-0 translate-y-16 scale-95 pointer-events-none"
      }`}
      role="alert"
      aria-live="polite"
    >
      {/* Top subtle highlight bar */}
      <div className="h-0.5 w-full bg-[#5B6240]" />

      <div className="p-3.5 sm:p-4">
        {/* Header row: Status badge & close button */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5B6240]">
              {currentReview.isInstantUserSubmission
                ? "Just Now · New Review"
                : "Verified Customer Feedback"}
            </span>
          </div>

          <button
            type="button"
            onClick={dismissCurrent}
            className="text-stone-400 hover:text-stone-800 p-1 cursor-pointer transition-colors"
            aria-label="Dismiss notification"
          >
            <FiX className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content row: Round Avatar + Details */}
        <div className="flex items-start gap-3">
          {/* Avatar: Full round circle with center letter & alphabet-based color */}
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-white text-base sm:text-lg uppercase shrink-0 shadow-xs select-none"
            style={{ backgroundColor: avatarBg }}
          >
            {firstLetter}
          </div>

          {/* Details Column */}
          <div className="flex-1 min-w-0">
            {/* Customer Name (Line-clamp 1) & Rating Stars */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-bold text-stone-900 truncate line-clamp-1">
                {currentReview.name}
                {currentReview.country && (
                  <span className="text-[10px] text-stone-400 font-normal ml-1">
                    ({currentReview.country})
                  </span>
                )}
              </span>

              {/* 5 Stars */}
              <div className="flex items-center text-amber-400 shrink-0">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar
                    key={star}
                    className={`w-3 h-3 ${
                      star <= ratingStars ? "fill-amber-400 text-amber-400" : "text-stone-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Product Name (Line-clamp 1) with Direct Link & visible Underline */}
            <Link
              href={`/product/${currentReview.productSlug}`}
              onClick={dismissCurrent}
              className="text-[11px] font-bold text-[#5B6240] underline underline-offset-3 decoration-[#5B6240] hover:text-[#3E432B] truncate line-clamp-1 block mt-0.5 cursor-pointer"
              title={`View ${currentReview.productName}`}
            >
              For {currentReview.productName} ↗
            </Link>

            {/* Customer Message (Line-clamp 2) */}
            <p className="text-xs text-stone-600 line-clamp-2 mt-1.5 leading-relaxed font-normal">
              "{currentReview.message}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
