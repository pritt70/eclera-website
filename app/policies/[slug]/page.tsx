"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FiChevronRight,
  FiCalendar,
  FiFileText,
  FiArrowRight,
  FiCheckCircle,
  FiHeadphones,
} from "react-icons/fi";
import { api } from "@/helper";

interface StorePolicy {
  _id?: string;
  title: string;
  slug: string;
  type?: string;
  summary?: string;
  content?: string;
  updatedAt?: string;
  sortOrder?: number;
}

/**
 * Format policy content:
 * If stored content contains markdown hashes/bullets, convert cleanly to semantic HTML.
 * If already HTML, return directly for dangerouslySetInnerHTML.
 */
function formatPolicyHtml(content: string): string {
  if (!content) return "";

  const hasMarkdownHeadings = /^#{1,6}\s+/m.test(content);
  const hasMarkdownBullets = /^\s*[\*\-]\s+/m.test(content);
  const hasMarkdownBold = /\*\*[^*]+\*\*/.test(content);

  // If already clean HTML without markdown tokens, return directly
  if (!hasMarkdownHeadings && !hasMarkdownBullets && !hasMarkdownBold) {
    return content;
  }

  let html = content;
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-base sm:text-lg font-bold text-stone-900 mt-6 sm:mt-7 mb-2 tracking-tight">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg sm:text-xl font-bold text-stone-900 mt-7 sm:mt-8 mb-2.5 sm:mb-3 tracking-tight">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl sm:text-2xl font-bold text-stone-900 mt-8 mb-3 sm:mb-4 tracking-tight">$1</h1>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-stone-900">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

  const lines = html.split("\n");
  const result: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("* ") || line.startsWith("- ")) {
      if (!inList) {
        result.push('<ul class="list-disc pl-4 sm:pl-5 my-3 space-y-1.5 text-stone-700 text-xs sm:text-sm">');
        inList = true;
      }
      result.push(`<li class="leading-relaxed">${line.substring(2)}</li>`);
    } else {
      if (inList) {
        result.push("</ul>");
        inList = false;
      }
      if (
        line.startsWith("<h1") ||
        line.startsWith("<h2") ||
        line.startsWith("<h3") ||
        line.startsWith("<h4") ||
        line.startsWith("<ul") ||
        line.startsWith("<li")
      ) {
        result.push(line);
      } else if (line.length > 0) {
        result.push(`<p class="my-2.5 text-xs sm:text-sm text-stone-700 leading-relaxed">${line}</p>`);
      }
    }
  }

  if (inList) {
    result.push("</ul>");
  }

  return result.join("\n");
}

function PolicyDetailContent() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  // Dynamic policy list from Database
  const [allPolicies, setAllPolicies] = useState<StorePolicy[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(true);

  // Current selected policy data from Database
  const [policy, setPolicy] = useState<StorePolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch dynamic policy list from database
  useEffect(() => {
    setPoliciesLoading(true);
    api("policies", undefined, "GET")
      .then((res) => {
        if (res && res.status && Array.isArray(res.data)) {
          setAllPolicies(res.data);
        }
      })
      .catch((err) => {
        console.error("Error loading policies list from database:", err);
      })
      .finally(() => {
        setPoliciesLoading(false);
      });
  }, []);

  // 2. Fetch specific policy document by slug from database
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    api(`policies/${slug}`, undefined, "GET")
      .then((res) => {
        if (res && res.status && res.data) {
          setPolicy(res.data);
        } else {
          setError(res?.message || "Policy document not found");
        }
      })
      .catch((err) => {
        setError(err?.message || "Failed to load policy document");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  // Format HTML content
  const formattedHtml = useMemo(() => {
    return formatPolicyHtml(policy?.content || "");
  }, [policy?.content]);

  // WhatsApp support redirection link (+91 7600152171) without naming WhatsApp anywhere in the UI
  const supportRedirectUrl = useMemo(() => {
    const policyName = policy?.title || slug?.replace(/-/g, " ") || "store policy";
    const message = encodeURIComponent(
      `Hi Eclera Team, I have a query regarding ${policyName}. Please assist me.`
    );
    return `https://wa.me/917600152171?text=${message}`;
  }, [policy?.title, slug]);

  return (
    <div className="w-full bg-[#FAF7F5] min-h-screen pb-16 sm:pb-20">
      {/* 1. Breadcrumbs in standard 1400px container */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-stone-500 font-medium">
            <Link href="/" className="hover:text-[#5B6240] transition-colors">
              Home
            </Link>
            <FiChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <Link href="/policies" className="hover:text-[#5B6240] transition-colors">
              Policies
            </Link>
            <FiChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="text-stone-900 font-semibold uppercase tracking-wider text-[11px] truncate max-w-[200px] sm:max-w-none">
              {policy?.title || slug?.replace(/-/g, " ")}
            </span>
          </nav>
        </div>
      </div>

      {/* 2. Top Header Banner: Clean title matching Categories & Collections, badge removed */}
      <section className="bg-white border-b border-stone-200 py-8 sm:py-12 md:py-14">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-stone-900 tracking-tight leading-tight">
            {policy?.title || slug?.replace(/-/g, " ")}
          </h1>

          <div className="w-16 sm:w-20 h-[3px] sm:h-[3.5px] bg-[#5B6240] rounded-none mt-3 sm:mt-4" />

          {policy?.updatedAt && (
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-stone-500 mt-3 sm:mt-4">
              <FiCalendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>
                Last Updated:{" "}
                {new Date(policy.updatedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 3. Main Policy Layout in Standard 1400px Container */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12">
        {/* Mobile Quick Policy Switcher (Dynamic from Database, smooth edge-to-edge scroll) */}
        {allPolicies.length > 0 && (
          <div className="lg:hidden mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto pb-2 flex items-center gap-2 scrollbar-none">
            {allPolicies.map((item) => {
              const isActive = slug === item.slug;
              return (
                <Link
                  key={item._id || item.slug}
                  href={`/policies/${item.slug}`}
                  className={`px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors border shrink-0 ${
                    isActive
                      ? "bg-[#5B6240] text-white border-[#5B6240] shadow-xs"
                      : "bg-white text-stone-700 border-stone-200 hover:border-stone-300 active:bg-stone-50"
                  }`}
                >
                  {item.title}
                </Link>
              );
            })}
          </div>
        )}

        {/* 2-Column Grid: Left Sidebar Navigation + Right Policy Article */}
        <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-10">
          {/* LEFT COLUMN: Sidebar Navigation (Dynamic from Database, only if policies exist) */}
          {allPolicies.length > 0 && (
            <aside className="hidden lg:block w-72 xl:w-80 shrink-0 space-y-6 sticky top-24">
              {/* Policy Menu Card */}
              <div className="bg-white border border-stone-200 p-5 shadow-2xs">
                <span className="text-[10px] font-semibold tracking-widest text-[#5B6240] uppercase block mb-1">
                  Navigation
                </span>
                <h2 className="text-sm font-semibold text-stone-900 tracking-wide pb-3 mb-3 border-b border-stone-200">
                  All Store Policies
                </h2>

                <nav className="space-y-1.5">
                  {policiesLoading ? (
                    <div className="py-6 text-center space-y-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-200 border-t-[#5B6240] mx-auto" />
                      <p className="text-[11px] text-stone-400">Loading policies...</p>
                    </div>
                  ) : (
                    allPolicies.map((item) => {
                      const isActive = slug === item.slug;
                      return (
                        <Link
                          key={item._id || item.slug}
                          href={`/policies/${item.slug}`}
                          className={`flex items-center justify-between p-3 text-xs transition-all ${
                            isActive
                              ? "bg-[#5B6240] text-white font-semibold shadow-xs"
                              : "text-stone-700 hover:bg-stone-50 hover:text-[#5B6240]"
                          }`}
                        >
                          <span className="truncate">{item.title}</span>
                          <FiChevronRight
                            className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                              isActive ? "text-white translate-x-0.5" : "text-stone-400"
                            }`}
                          />
                        </Link>
                      );
                    })
                  )}
                </nav>
              </div>
            </aside>
          )}

          {/* RIGHT COLUMN: Policy Content Article */}
          <main className="flex-1 min-w-0 w-full">
            <div className="bg-white border border-stone-200 p-4 sm:p-7 md:p-10 lg:p-12 shadow-2xs">
              {loading ? (
                <div className="py-20 sm:py-24 text-center flex flex-col items-center justify-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-[#5B6240]" />
                  <p className="text-xs text-stone-500 font-medium">Loading policy document...</p>
                </div>
              ) : error || !policy ? (
                <div className="py-14 sm:py-16 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-[#F1F3EC] text-[#5B6240] mx-auto flex items-center justify-center">
                    <FiFileText className="w-6 h-6" />
                  </div>
                  <h2 className="text-base font-semibold text-stone-800">Policy Page Not Found</h2>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    {error || "The requested policy page does not exist or has been moved."}
                  </p>
                  <Link
                    href="/"
                    className="inline-block mt-2 px-6 py-2.5 text-xs font-semibold bg-[#5B6240] text-white hover:bg-[#474D32] transition-colors"
                  >
                    Return to Home
                  </Link>
                </div>
              ) : (
                <article className="overflow-hidden">
                  {/* Summary Callout Banner if available */}
                  {policy.summary && (
                    <div className="mb-6 sm:mb-8 p-3.5 sm:p-5 bg-[#FAF9F5] border-l-4 border-[#5B6240] border-t border-r border-b border-stone-200 text-xs sm:text-sm text-stone-700 leading-relaxed flex items-start gap-2.5 sm:gap-3">
                      <FiCheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-[#5B6240] shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold text-stone-900 block mb-0.5 text-xs sm:text-sm">
                          Policy Overview
                        </strong>
                        <span className="text-xs sm:text-sm text-stone-600">{policy.summary}</span>
                      </div>
                    </div>
                  )}

                  {/* Render Semantic HTML Content directly from Database */}
                  <div
                    className="policy-content space-y-3.5 sm:space-y-4 text-xs sm:text-sm text-stone-700 leading-relaxed break-words"
                    dangerouslySetInnerHTML={{ __html: formattedHtml }}
                  />

                  {/* 4. Contact Support Box: Redirects to WhatsApp directly without mentioning WhatsApp */}
                  <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 sm:p-6 bg-[#FAF9F5] border border-stone-200/90">
                    <div className="space-y-1">
                      <h4 className="text-xs sm:text-sm font-semibold text-stone-900">
                        Need help or clarification?
                      </h4>
                      <p className="text-[11px] sm:text-xs text-stone-600 leading-relaxed max-w-md">
                        Have any queries regarding our {policy.title || "store policies"}? Our support team is available to assist you.
                      </p>
                    </div>

                    <a
                      href={supportRedirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 bg-[#5B6240] hover:bg-[#474D32] text-white text-xs font-semibold tracking-wider transition-colors shadow-xs shrink-0 cursor-pointer active:scale-[0.99]"
                    >
                      <FiHeadphones className="w-4 h-4 shrink-0" />
                      <span>Contact Support</span>
                      <FiArrowRight className="w-4 h-4 shrink-0" />
                    </a>
                  </div>
                </article>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Scoped CSS for Rich Policy HTML Content from Database */}
      <style jsx global>{`
        .policy-content {
          word-break: break-word;
          overflow-wrap: break-word;
        }
        .policy-content h1,
        .policy-content h2,
        .policy-content h3,
        .policy-content h4 {
          color: #1c1917;
          font-weight: 700;
          letter-spacing: -0.01em;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          line-height: 1.35;
        }
        @media (min-width: 640px) {
          .policy-content h1,
          .policy-content h2,
          .policy-content h3,
          .policy-content h4 {
            margin-top: 1.75rem;
          }
        }
        .policy-content h1 {
          font-size: 1.25rem;
        }
        @media (min-width: 640px) {
          .policy-content h1 {
            font-size: 1.35rem;
          }
        }
        .policy-content h2 {
          font-size: 1.1rem;
        }
        @media (min-width: 640px) {
          .policy-content h2 {
            font-size: 1.2rem;
          }
        }
        .policy-content h3 {
          font-size: 1rem;
        }
        @media (min-width: 640px) {
          .policy-content h3 {
            font-size: 1.05rem;
          }
        }
        .policy-content h4 {
          font-size: 0.9rem;
        }
        .policy-content p {
          color: #44403c;
          line-height: 1.7;
          margin-bottom: 0.75rem;
        }
        @media (min-width: 640px) {
          .policy-content p {
            line-height: 1.75;
            margin-bottom: 0.85rem;
          }
        }
        .policy-content ul {
          list-style-type: disc;
          padding-left: 1.15rem;
          margin-top: 0.4rem;
          margin-bottom: 0.85rem;
          color: #44403c;
        }
        .policy-content ol {
          list-style-type: decimal;
          padding-left: 1.15rem;
          margin-top: 0.4rem;
          margin-bottom: 0.85rem;
          color: #44403c;
        }
        .policy-content ul ul,
        .policy-content ol ol,
        .policy-content ul ol,
        .policy-content ol ul {
          padding-left: 1rem;
          margin-top: 0.25rem;
          margin-bottom: 0.4rem;
        }
        .policy-content ul ul {
          list-style-type: circle;
        }
        .policy-content li {
          line-height: 1.6;
          margin-bottom: 0.35rem;
        }
        .policy-content strong,
        .policy-content b {
          font-weight: 600;
          color: #1c1917;
        }
        .policy-content a {
          color: #5b6240;
          text-decoration: underline;
          font-weight: 500;
          word-break: break-all;
        }
        .policy-content a:hover {
          color: #474d32;
        }
        .policy-content table {
          display: block;
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        .policy-content th,
        .policy-content td {
          border: 1px solid #e7e5e4;
          padding: 0.5rem 0.75rem;
          text-align: left;
          font-size: 0.8rem;
        }
        .policy-content th {
          background-color: #faf9f5;
          font-weight: 600;
          color: #1c1917;
        }
        .policy-content blockquote {
          border-left: 3px solid #5b6240;
          padding-left: 0.85rem;
          color: #57534e;
          font-style: italic;
          margin: 0.85rem 0;
        }
        .policy-content img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
}

export default function PolicyDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full bg-[#FAF7F5] min-h-screen py-16 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-[#5B6240]" />
        </div>
      }
    >
      <PolicyDetailContent />
    </Suspense>
  );
}
