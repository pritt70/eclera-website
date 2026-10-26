"use client";

import React, { useState, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import {
  RiInstagramLine,
  RiFacebookFill,
  RiThreadsFill,
  RiYoutubeFill,
  RiTwitterXFill,
  RiPinterestFill,
  RiTumblrFill,
  RiLinkedinFill,
} from "react-icons/ri";
import {
  FiChevronLeft,
  FiChevronRight,
  FiVolume2,
  FiVolumeX,
  FiPlay,
  FiPause,
} from "react-icons/fi";
import { api } from "@/helper";

import "swiper/css";
import "swiper/css/navigation";

interface SocialLinkData {
  platform: string;
  title: string;
  url: string;
}

interface SocialPostData {
  _id: string;
  mediaType: "video" | "image";
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  platform?: string;
  link?: string;
  status?: string;
}

export function SocialSection() {
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [posts, setPosts] = useState<SocialPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutedStates, setMutedStates] = useState<Record<string, boolean>>({});
  const [playingStates, setPlayingStates] = useState<Record<string, boolean>>({});
  const [prevEl, setPrevEl] = useState<HTMLButtonElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLButtonElement | null>(null);

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    async function fetchSocialData() {
      try {
        setLoading(true);
        const res = await api("social", undefined, "GET");
        if (res && res.status && res.data) {
          setSocialLinks(res.data.links || {});
          setPosts(res.data.posts || []);
        }
      } catch (err) {
        console.error("Failed to load social section data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSocialData();
  }, []);

  // Ensure enough slides so Swiper infinite loop smoothly covers the full right viewport edge
  const displayPosts = React.useMemo(() => {
    if (!posts || posts.length === 0) return [];
    let list = [...posts];
    while (list.length < 16) {
      list = [...list, ...posts];
    }
    return list;
  }, [posts]);

  // Platform visual presets matching website theme (strictly social channels)
  const SOCIAL_PLATFORMS: Record<
    string,
    {
      name: string;
      icon: React.ReactNode;
    }
  > = {
    instagram: {
      name: "Instagram",
      icon: <RiInstagramLine className="w-5 h-5 text-[#E1306C]" />,
    },
    youtube: {
      name: "YouTube",
      icon: <RiYoutubeFill className="w-5 h-5 text-[#FF0000]" />,
    },
    thread: {
      name: "Threads",
      icon: <RiThreadsFill className="w-5 h-5 text-stone-900" />,
    },
    facebook: {
      name: "Facebook",
      icon: <RiFacebookFill className="w-5 h-5 text-[#1877F2]" />,
    },
    x: {
      name: "X (Twitter)",
      icon: <RiTwitterXFill className="w-5 h-5 text-stone-900" />,
    },
    pinterest: {
      name: "Pinterest",
      icon: <RiPinterestFill className="w-5 h-5 text-[#E60023]" />,
    },
    tumblr: {
      name: "Tumblr",
      icon: <RiTumblrFill className="w-5 h-5 text-[#36465D]" />,
    },
    linkedin: {
      name: "LinkedIn",
      icon: <RiLinkedinFill className="w-5 h-5 text-[#0A66C2]" />,
    },
  };

  // Only active social platforms that have a link configured
  const activeSocialKeys = Object.keys(SOCIAL_PLATFORMS).filter(
    (key) => Boolean(socialLinks[key] && socialLinks[key].trim())
  );

  // Toggle Mute on Video Reel
  const handleToggleMute = (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newMuted = !(mutedStates[postId] ?? true);
    setMutedStates((prev) => ({ ...prev, [postId]: newMuted }));
    Object.keys(videoRefs.current).forEach((key) => {
      if (key.startsWith(postId)) {
        const vid = videoRefs.current[key];
        if (vid) vid.muted = newMuted;
      }
    });
  };

  // Toggle Play / Pause on Video Reel
  const handleTogglePlay = (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const isPlaying = playingStates[postId] ?? true;
    const newPlaying = !isPlaying;
    setPlayingStates((prev) => ({ ...prev, [postId]: newPlaying }));
    Object.keys(videoRefs.current).forEach((key) => {
      if (key.startsWith(postId)) {
        const vid = videoRefs.current[key];
        if (vid) {
          if (newPlaying) vid.play().catch(() => {});
          else vid.pause();
        }
      }
    });
  };

  return (
    <>
      {/* 1. COMMUNITY REELS & SKINCARE ROUTINES (Dedicated Video Section with distinct shade) */}
      {posts.length > 0 && (
        <section className="w-full py-12 sm:py-16 md:py-20 bg-[#F7F5F0] border-t border-b border-stone-200/80 overflow-hidden">
          {/* Header Container (aligned with standard page grid) */}
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200/60 pb-5">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-stone-900 tracking-tight">
                  Community Reels & Skincare Routines
                </h2>
                <div className="w-16 h-[3px] bg-[#5B6240] rounded-none mt-2.5" />
                <p className="text-xs sm:text-sm text-stone-600 mt-2">
                  Real formulas in action. Hover or tap on any reel to unmute and play!
                </p>
              </div>

              {/* Swiper Navigation Controls - Full Rounded & Primary Color #5B6240 */}
              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                <button
                  ref={(node) => setPrevEl(node)}
                  id="social-swiper-prev"
                  className="w-10 h-10 sm:w-11 sm:h-11 bg-[#5B6240] text-white hover:bg-[#484e31] active:scale-95 transition-all duration-200 rounded-full shadow-sm flex items-center justify-center cursor-pointer border border-[#5B6240]"
                  aria-label="Previous reel"
                >
                  <FiChevronLeft className="w-5 h-5" />
                </button>
                <button
                  ref={(node) => setNextEl(node)}
                  id="social-swiper-next"
                  className="w-10 h-10 sm:w-11 sm:h-11 bg-[#5B6240] text-white hover:bg-[#484e31] active:scale-95 transition-all duration-200 rounded-full shadow-sm flex items-center justify-center cursor-pointer border border-[#5B6240]"
                  aria-label="Next reel"
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Left side keeps container space as it is; Right side bleeds edge-to-edge covering all space */}
          <div className="w-full social-feed-container overflow-hidden">
            <Swiper
              modules={[Navigation, Autoplay]}
              navigation={{
                prevEl,
                nextEl,
              }}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              spaceBetween={16}
              slidesPerView={1.35}
              loop={displayPosts.length >= 6}
              breakpoints={{
                400: { slidesPerView: 1.7, spaceBetween: 14 },
                520: { slidesPerView: 2.3, spaceBetween: 16 },
                680: { slidesPerView: 2.85, spaceBetween: 18 },
                840: { slidesPerView: 3.5, spaceBetween: 18 },
                1080: { slidesPerView: 4.4, spaceBetween: 20 },
                1360: { slidesPerView: 5.4, spaceBetween: 20 },
                1680: { slidesPerView: 6.4, spaceBetween: 22 },
                1920: { slidesPerView: 7.3, spaceBetween: 24 },
              }}
              className="py-1"
            >
              {displayPosts.map((post, idx) => {
                const uniqueKey = `${post._id}-${idx}`;
                const isVideo =
                  post.mediaType === "video" ||
                  post.mediaUrl?.endsWith(".mp4") ||
                  post.mediaUrl?.endsWith(".webm");

                const isMuted = mutedStates[post._id] ?? true;
                const isPlaying = playingStates[post._id] ?? true;

                return (
                  <SwiperSlide key={uniqueKey} className="h-auto">
                    <div className="group relative aspect-[9/16] overflow-hidden bg-stone-900 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between border border-stone-200/80 rounded-2xl">
                      {/* Video / Image Display */}
                      {isVideo ? (
                        <video
                          ref={(el) => {
                            videoRefs.current[uniqueKey] = el;
                          }}
                          src={post.mediaUrl}
                          autoPlay
                          muted={isMuted}
                          loop
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <img
                          src={post.mediaUrl}
                          alt="Eclera skincare"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}

                      {/* Top Overlay: ONLY Sound & Play/Pause Controls (No tag, No description) */}
                      {isVideo && (
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleToggleMute(e, post._id)}
                            className="h-8 w-8 bg-black/60 hover:bg-black/90 border border-white/20 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer backdrop-blur-xs"
                            title={isMuted ? "Unmute" : "Mute"}
                            aria-label={isMuted ? "Unmute reel" : "Mute reel"}
                          >
                            {isMuted ? (
                              <FiVolumeX className="w-4 h-4" />
                            ) : (
                              <FiVolume2 className="w-4 h-4 text-emerald-400" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleTogglePlay(e, post._id)}
                            className="h-8 w-8 bg-black/60 hover:bg-black/90 border border-white/20 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer backdrop-blur-xs"
                            title={isPlaying ? "Pause" : "Play"}
                            aria-label={isPlaying ? "Pause reel" : "Play reel"}
                          >
                            {isPlaying ? (
                              <FiPause className="w-4 h-4" />
                            ) : (
                              <FiPlay className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        </section>
      )}

      {/* 2. OFFICIAL SOCIAL CHANNELS (Dedicated Clean White Strip) */}
      {activeSocialKeys.length > 0 && (
        <section className="w-full py-12 sm:py-14 bg-white border-t border-b border-stone-200">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-stone-900 tracking-tight">
                Connect With Us On Social Media
              </h2>
              <div className="w-12 h-[2.5px] bg-[#5B6240] mx-auto mt-2.5 mb-2.5" />
              <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
                Follow our official channels for everyday clean skincare rituals, behind-the-scenes formulations, and real community results.
              </p>
            </div>

            {/* Social Pills: Only Icon & Platform Name, Directly Redirects */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-4xl mx-auto pt-2">
              {activeSocialKeys.map((key) => {
                const meta = SOCIAL_PLATFORMS[key];
                if (!meta) return null;

                const targetUrl = socialLinks[key] || "#";

                return (
                  <a
                    key={key}
                    href={targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    title={`Open ${meta.name} account`}
                    className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 bg-white border border-stone-200 hover:border-[#5B6240] hover:ring-1 hover:ring-[#5B6240] rounded-full transition-all duration-150 cursor-pointer"
                  >
                    <span className="shrink-0">{meta.icon}</span>
                    <span className="text-xs sm:text-sm font-semibold text-stone-800">
                      {meta.name}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default SocialSection;
