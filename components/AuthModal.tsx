"use client";

import React, { useState, useEffect } from "react";
import { FiX, FiEye, FiEyeOff, FiCheck, FiUser, FiLock, FiMail } from "react-icons/fi";
import { api, setCookie } from "@/helper";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
}

interface CustomerProfile {
  _id: string;
  fullName: string;
  firstName?: string;
  phone: string;
  email?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dynamic Banner from Admin Panel
  const [banner, setBanner] = useState<any | null>(null);
  const [bannerLoaded, setBannerLoaded] = useState(false);

  // Sync mode with initialMode prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg(null);
      setSuccessMsg(null);
      setPhone("");
      setPassword("");
      setName("");
      setEmail("");
    }
  }, [isOpen, initialMode]);

  // Fetch dynamic auth banner from Admin Panel
  useEffect(() => {
    async function fetchAuthBanner() {
      try {
        const res = await api("auth-banner", undefined, "GET");
        if (res && res.status && res.data && res.data.image) {
          const imgUrl = res.data.image.publicUrl || res.data.image.url;
          if (imgUrl && imgUrl.trim()) {
            setBanner(res.data);
          } else {
            setBanner(null);
          }
        } else {
          setBanner(null);
        }
      } catch (err) {
        console.error("Error fetching auth banner:", err);
        setBanner(null);
      } finally {
        setBannerLoaded(true);
      }
    }

    if (isOpen) {
      fetchAuthBanner();
    }
  }, [isOpen]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Clean Phone
    const cleanPhone = phone.replace(/[^0-9]/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!password || password.trim().length < 4) {
      setErrorMsg("Password must be at least 4 characters.");
      return;
    }

    if (mode === "signup" && (!name || !name.trim())) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === "signup" ? "auth/signup" : "auth/login";
      const payload: any = {
        authType: "phone",
        mode,
        phone: cleanPhone,
        password: password.trim(),
      };

      if (mode === "signup") {
        payload.name = name.trim();
        if (email && email.trim()) {
          payload.email = email.trim().toLowerCase();
        }
      }

      const res = await api(endpoint, payload, "POST");

      if (res && res.status && res.data) {
        const customer = res.data.customer;
        const token = res.data.token;

        // Store customer session in LocalStorage and Cookies
        if (customer) {
          localStorage.setItem("eclera_customer", JSON.stringify(customer));
        }
        if (token) {
          localStorage.setItem("eclera_customer_token", token);
          setCookie("eclera_customer_token", token, 7);
        }

        // Automatically fulfill any pending quick add to cart
        try {
          const pending = localStorage.getItem("eclera_pending_quick_add");
          if (pending) {
            const prod = JSON.parse(pending);
            localStorage.removeItem("eclera_pending_quick_add");
            const existing = localStorage.getItem("eclera_cart");
            let cart = existing ? JSON.parse(existing) : [];
            if (!Array.isArray(cart)) cart = [];

            const primaryImage =
              prod.images?.[0]?.publicUrl ||
              prod.images?.[0]?.url ||
              prod.image ||
              "";

            const idx = cart.findIndex((i: any) => i._id === prod._id);
            if (idx > -1) {
              cart[idx].quantity = (cart[idx].quantity || 1) + (prod.quantity || 1);
            } else {
              cart.push({
                _id: prod._id,
                name: prod.name,
                slug: prod.slug,
                price: prod.price,
                comparePrice: prod.comparePrice || prod.price,
                image: primaryImage,
                quantity: prod.quantity || 1,
              });
            }
            localStorage.setItem("eclera_cart", JSON.stringify(cart));
            window.dispatchEvent(new Event("eclera_cart_updated"));
          }
        } catch (e) {
          console.error("Failed to fulfill pending quick add:", e);
        }

        // Notify entire app of auth state change
        window.dispatchEvent(new Event("eclera_customer_auth_changed"));

        setSuccessMsg(
          mode === "signup"
            ? `Welcome to Eclera, ${customer.fullName || "Customer"}! Account created.`
            : `Welcome back, ${customer.fullName || "Customer"}! Logged in successfully.`
        );

        // Auto close modal after brief confirmation
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res?.message || "Authentication failed. Please verify your details.");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setErrorMsg(err?.message || "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const bannerImgUrl = banner?.image?.publicUrl || banner?.image?.url || "";
  const hasBanner = Boolean(bannerImgUrl && bannerImgUrl.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card (Strictly rounded-none) */}
      <div
        className={`relative z-10 w-full bg-white shadow-2xl rounded-none border border-stone-200 transition-all duration-300 my-auto ${
          hasBanner
            ? "max-w-3xl flex flex-col md:flex-row max-h-[92vh] overflow-y-auto md:overflow-hidden"
            : "max-w-md mx-auto max-h-[92vh] overflow-y-auto"
        }`}
      >
        {/* Close Button (rounded-none) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-3 right-3 z-30 p-2 text-stone-600 hover:text-stone-950 bg-white/90 hover:bg-white rounded-none border border-stone-200 shadow-2xs transition-colors cursor-pointer"
        >
          <FiX className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* 1. LEFT SIDE: Dynamic Banner Image from Admin Panel (Pure image without overlaid text) */}
        {hasBanner && (
          <div className="relative w-full md:w-[45%] h-[160px] sm:h-[220px] md:h-auto bg-stone-100 overflow-hidden rounded-none shrink-0 flex items-center justify-center">
            <img
              src={bannerImgUrl}
              alt={banner?.title || "Eclera Cosmetics"}
              className="w-full h-full object-cover object-center rounded-none"
            />
          </div>
        )}

        {/* 2. RIGHT SIDE (or full width if no banner): Login / Sign Up Form */}
        <div
          className={`flex-1 p-5 sm:p-7 md:p-8 flex flex-col justify-center bg-white rounded-none md:overflow-y-auto ${
            hasBanner ? "md:w-[55%]" : "w-full"
          }`}
        >
          {/* Brand Heading */}
          <div className="text-left mb-5 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 tracking-tight">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 leading-relaxed">
              {mode === "login"
                ? "Enter your 10-digit mobile number and password to access your account."
                : "Join Eclera for personalized clean beauty rituals and order tracking."}
            </p>
          </div>

          {/* Tab Switcher: LOGIN vs SIGN UP (rounded-none) */}
          <div className="flex border-b border-stone-200 mb-6 rounded-none">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`pb-2.5 px-4 text-xs font-semibold tracking-wider uppercase transition-colors rounded-none cursor-pointer border-b-2 -mb-[1px] ${
                mode === "login"
                  ? "border-[#5B6240] text-[#5B6240]"
                  : "border-transparent text-stone-400 hover:text-stone-700"
              }`}
            >
              LOGIN
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`pb-2.5 px-4 text-xs font-semibold tracking-wider uppercase transition-colors rounded-none cursor-pointer border-b-2 -mb-[1px] ${
                mode === "signup"
                  ? "border-[#5B6240] text-[#5B6240]"
                  : "border-transparent text-stone-400 hover:text-stone-700"
              }`}
            >
              SIGN UP
            </button>
          </div>

          {/* Error Message Box */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-none">
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Success Message Box */}
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-none flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field: Full Name (Only on Signup) */}
            {mode === "signup" && (
              <div className="space-y-1">
                <label
                  htmlFor="auth-fullname"
                  className="block text-xs font-semibold text-stone-700 tracking-wider uppercase"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <FiUser className="w-4 h-4" />
                  </span>
                  <input
                    id="auth-fullname"
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-white border border-stone-300 focus:border-[#5B6240] focus:outline-none rounded-none text-stone-900 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Field: Mobile Number (Both Login & Signup) */}
            <div className="space-y-1">
              <label
                htmlFor="auth-phone"
                className="block text-xs font-semibold text-stone-700 tracking-wider uppercase"
              >
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-xs sm:text-sm font-semibold text-stone-700 bg-stone-100 border border-r-0 border-stone-300 select-none rounded-none">
                  +91
                </span>
                <input
                  id="auth-phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  placeholder="Enter your mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                  disabled={loading}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm bg-white border border-stone-300 focus:border-[#5B6240] focus:outline-none rounded-none text-stone-900 transition-colors"
                />
              </div>
            </div>

            {/* Field: Email Address (Optional, on Signup) */}
            {mode === "signup" && (
              <div className="space-y-1">
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-semibold text-stone-700 tracking-wider uppercase"
                >
                  Email Address <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <FiMail className="w-4 h-4" />
                  </span>
                  <input
                    id="auth-email"
                    type="email"
                    placeholder="Enter your email id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-white border border-stone-300 focus:border-[#5B6240] focus:outline-none rounded-none text-stone-900 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Field: Password (Both Login & Signup) */}
            <div className="space-y-1">
              <label
                htmlFor="auth-password"
                className="block text-xs font-semibold text-stone-700 tracking-wider uppercase"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <FiLock className="w-4 h-4" />
                </span>
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm bg-white border border-stone-300 focus:border-[#5B6240] focus:outline-none rounded-none text-stone-900 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  {showPassword ? (
                    <FiEyeOff className="w-4 h-4" />
                  ) : (
                    <FiEye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button (rounded-none, Primary Color #5B6240) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-[#5B6240] hover:bg-[#474d32] text-white font-semibold text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 shadow-sm rounded-none cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Please wait...</span>
              ) : mode === "login" ? (
                <span>LOG IN</span>
              ) : (
                <span>CREATE ACCOUNT</span>
              )}
            </button>
          </form>

          {/* Toggle between Login and Signup */}
          <div className="mt-5 text-center text-xs text-stone-600">
            {mode === "login" ? (
              <p>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="font-semibold text-[#5B6240] hover:underline cursor-pointer"
                >
                  Sign Up Now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="font-semibold text-[#5B6240] hover:underline cursor-pointer"
                >
                  Log In Here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
