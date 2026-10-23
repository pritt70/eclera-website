"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FiChevronRight, FiCalendar, FiShield, FiFileText } from "react-icons/fi";
import { api } from "@/helper";

export default function PolicyDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    api(`policies/${slug}`, undefined, "GET")
      .then((res) => {
        if (res && res.status && res.data) {
          setPolicy(res.data);
        } else {
          setError(res?.message || "Policy page not found");
        }
      })
      .catch((err) => {
        setError(err?.message || "Failed to load policy");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  return (
    <div className="bg-[#FAF7F5] min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-stone-500 mb-6">
          <Link href="/" className="hover:text-[#B4395A] transition-colors">
            Home
          </Link>
          <FiChevronRight className="w-3 h-3 text-stone-400" />
          <span className="text-stone-400">Policies</span>
          <FiChevronRight className="w-3 h-3 text-stone-400" />
          <span className="font-semibold text-stone-800 capitalize">
            {policy?.title || slug?.replace(/-/g, " ")}
          </span>
        </nav>

        {/* Content Box */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 sm:p-10">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-[#B4395A]" />
              <p className="text-xs text-stone-500 font-medium">Loading policy document...</p>
            </div>
          ) : error || !policy ? (
            <div className="py-16 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-rose-50 text-[#B4395A] mx-auto flex items-center justify-center">
                <FiFileText className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-stone-800">Policy Page Not Found</h2>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {error || "The requested policy page does not exist or has been moved."}
              </p>
              <Link
                href="/"
                className="inline-block mt-2 px-5 py-2 text-xs font-semibold bg-[#B4395A] text-white rounded-full hover:bg-[#9b2f4c] transition-colors"
              >
                Return to Home
              </Link>
            </div>
          ) : (
            <article className="space-y-6">
              {/* Header */}
              <header className="border-b border-stone-200 pb-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#B4395A] uppercase tracking-wider mb-1.5">
                  <FiShield className="w-3.5 h-3.5" />
                  <span>Eclera Official Store Policy</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
                  {policy.title}
                </h1>
                {policy.updatedAt && (
                  <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-2">
                    <FiCalendar className="w-3.5 h-3.5" />
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
              </header>

              {/* Policy Body (Renders HTML cleanly) */}
              <div
                className="prose prose-stone max-w-none text-xs sm:text-sm text-stone-700 leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ __html: policy.content }}
              />

              {/* Assistance Box */}
              <div className="mt-10 p-5 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-stone-900 mb-0.5">Need help or clarification?</p>
                  <p className="text-stone-500">
                    Contact our customer support team at support@eclera.com
                  </p>
                </div>
                <a
                  href="mailto:support@eclera.com"
                  className="px-4 py-2 bg-stone-900 text-white rounded-md font-semibold hover:bg-[#B4395A] transition-colors whitespace-nowrap"
                >
                  Contact Support
                </a>
              </div>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
