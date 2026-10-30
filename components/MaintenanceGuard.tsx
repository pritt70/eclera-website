"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/helper";
import { FiRefreshCw, FiClock } from "react-icons/fi";

interface MaintenanceData {
  isActive: boolean;
  title: string;
  description: string;
}

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const [maintenance, setMaintenance] = useState<MaintenanceData | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const checkMaintenance = async () => {
    try {
      const res = await api("maintenance", undefined, "GET");
      if (res && res.status && res.data) {
        setMaintenance({
          isActive: Boolean(res.data.isActive),
          title: res.data.title || "",
          description: res.data.description || "",
        });
      }
    } catch (err) {
      console.error("Failed to check site maintenance status from database:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    checkMaintenance();

    // Periodically re-check maintenance status every 30 seconds
    const interval = setInterval(() => {
      checkMaintenance();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    checkMaintenance();
  };

  // If maintenance mode is active in database, render the pure white centered page
  if (maintenance?.isActive) {
    return (
      <div className="fixed inset-0 z-[999999] min-h-screen w-full bg-white flex flex-col items-center justify-center p-6 text-center select-none overflow-y-auto">
        <div className="max-w-xl mx-auto flex flex-col items-center animate-in fade-in duration-300">
          {/* Subtle Brand Tag */}
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#5B6240] mb-6">
            ECLERA COSMETICS
          </span>

          {/* Elegant Circular Maintenance Icon */}
          <div className="w-16 h-16 rounded-full bg-[#FAF9F5] border border-stone-200 flex items-center justify-center text-[#5B6240] shadow-2xs mb-6">
            <FiClock className="w-7 h-7 stroke-[1.8]" />
          </div>

          {/* Dynamic Maintenance Title from Database */}
          {maintenance.title ? (
            <h1 className="text-2xl sm:text-4xl font-bold text-stone-900 tracking-tight leading-snug">
              {maintenance.title}
            </h1>
          ) : null}

          {/* Dynamic Maintenance Description from Database */}
          {maintenance.description ? (
            <p className="text-sm sm:text-base text-stone-600 max-w-md mx-auto mt-4 leading-relaxed font-normal">
              {maintenance.description}
            </p>
          ) : null}

          {/* Pulsing indicator pill */}
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-stone-50 border border-stone-200 text-xs font-medium text-stone-700">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Scheduled Maintenance in Progress</span>
          </div>

          {/* Refresh Check Button */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5B6240] hover:bg-[#474D32] text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? "Checking Status..." : "Check If We're Back"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If maintenance is not active in database, render normal website content
  return <>{children}</>;
}
