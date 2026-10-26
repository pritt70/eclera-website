"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiShoppingBag,
  FiHeart,
  FiUser,
  FiMenu,
  FiX,
  FiLogOut,
  FiChevronDown,
} from "react-icons/fi";
import {
  RiTwitterXFill,
  RiFacebookFill,
  RiPinterestFill,
  RiInstagramLine,
} from "react-icons/ri";
import { AnnouncementBar } from "./AnnouncementBar";
import { AuthModal } from "./AuthModal";
import { deleteCookie } from "@/helper";

export function Header() {
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);
  const [wishlistCount, setWishlistCount] = useState<number>(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Customer Auth state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");
  const [customer, setCustomer] = useState<any | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Sync cartCount with localStorage and listen for updates
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const saved = localStorage.getItem("eclera_cart");
        if (saved) {
          const items = JSON.parse(saved);
          const count = Array.isArray(items)
            ? items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0)
            : 0;
          setCartCount(count);
        } else {
          setCartCount(0);
        }
      } catch {
        setCartCount(0);
      }
    };
    updateCartCount();
    window.addEventListener("eclera_cart_updated", updateCartCount);
    window.addEventListener("storage", updateCartCount);
    return () => {
      window.removeEventListener("eclera_cart_updated", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  // Sync customer authentication state
  useEffect(() => {
    const updateCustomerAuth = () => {
      try {
        const saved = localStorage.getItem("eclera_customer");
        if (saved) {
          setCustomer(JSON.parse(saved));
        } else {
          setCustomer(null);
        }
      } catch {
        setCustomer(null);
      }
    };

    updateCustomerAuth();
    window.addEventListener("eclera_customer_auth_changed", updateCustomerAuth);
    window.addEventListener("storage", updateCustomerAuth);

    const handleOpenAuth = (e: any) => {
      const mode = e?.detail?.mode || "login";
      setAuthModalMode(mode);
      setAuthModalOpen(true);
    };
    window.addEventListener("eclera_open_auth_modal", handleOpenAuth);

    return () => {
      window.removeEventListener("eclera_customer_auth_changed", updateCustomerAuth);
      window.removeEventListener("storage", updateCustomerAuth);
      window.removeEventListener("eclera_open_auth_modal", handleOpenAuth);
    };
  }, []);

  // Handle Customer Logout
  const handleLogout = () => {
    localStorage.removeItem("eclera_customer");
    localStorage.removeItem("eclera_customer_token");
    deleteCookie("eclera_customer_token");
    setCustomer(null);
    setUserDropdownOpen(false);
    window.dispatchEvent(new Event("eclera_customer_auth_changed"));
  };

  // Detect scroll for sleek sticky header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Sticky Header Container (Keeps Announcement Bar and Header fixed on scroll) */}
      <div className="sticky top-0 z-40 w-full">
        {/* Top Announcement Bar */}
        <AnnouncementBar />

        {/* Main Header */}
        <header
          className={`w-full transition-all duration-200 ${
            isScrolled
              ? "bg-white/95 backdrop-blur-md shadow-xs border-b border-stone-200"
              : "bg-white border-b border-stone-100"
          }`}
        >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
            {/* Left: Mobile Toggle Menu Button (Mobile & Tablet only) */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 -ml-2 text-stone-800 hover:text-[#5B6240] active:bg-stone-100 rounded-lg transition-colors focus:outline-none"
                aria-label="Open Navigation Menu"
              >
                <FiMenu className="w-6 h-6" />
              </button>
            </div>

            {/* Brand Logo from public/assets/images/eclera-logo.svg */}
            <div className="flex items-center shrink-0">
              <Link href="/" className="flex items-center">
                <img
                  src="/assets/images/eclera-logo.svg"
                  alt="Eclera Cosmetics"
                  className="h-8 sm:h-10 w-auto object-contain hover:opacity-95 transition-opacity"
                />
              </Link>
            </div>

            {/* Simple Desktop Navigation Links: Home, Categories, Shop */}
            <nav className="hidden lg:flex items-center space-x-10">
              <Link
                href="/"
                className={`text-xs font-semibold tracking-wider uppercase transition-colors hover:text-[#5B6240] ${
                  pathname === "/" ? "text-[#5B6240] font-bold" : "text-stone-700"
                }`}
              >
                Home
              </Link>

              <Link
                href="/categories"
                className={`text-xs font-semibold tracking-wider uppercase transition-colors hover:text-[#5B6240] ${
                  pathname.startsWith("/categories") ? "text-[#5B6240] font-bold" : "text-stone-700"
                }`}
              >
                Categories
              </Link>

              <Link
                href="/shop"
                className={`text-xs font-semibold tracking-wider uppercase transition-colors hover:text-[#5B6240] ${
                  pathname.startsWith("/shop") ? "text-[#5B6240] font-bold" : "text-stone-700"
                }`}
              >
                Shop
              </Link>
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center space-x-1.5 sm:space-x-3 text-stone-700">
              {/* User Account / Profile (Desktop & Tablet) */}
              {customer ? (
                <div className="relative hidden sm:inline-block">
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 text-stone-800 hover:text-[#5B6240] hover:bg-stone-50 rounded-none border border-stone-200 transition-colors cursor-pointer"
                    title={`Logged in as ${customer.fullName || "Customer"}`}
                  >
                    <div className="w-5 h-5 bg-[#5B6240] text-white rounded-none flex items-center justify-center text-[10px] font-bold uppercase">
                      {(customer.fullName || "C")[0]}
                    </div>
                    <span className="text-xs font-semibold max-w-[100px] truncate hidden md:inline">
                      {customer.firstName || customer.fullName?.split(" ")[0] || "Account"}
                    </span>
                    <FiChevronDown className="w-3.5 h-3.5 text-stone-500" />
                  </button>

                  {/* Customer Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 shadow-xl rounded-none py-2 z-50 animate-in fade-in slide-in-from-top-1">
                      <div className="px-4 py-2 border-b border-stone-100">
                        <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                          Signed in as
                        </p>
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {customer.fullName || "Customer"}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate">
                          +91 {customer.phone}
                        </p>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/account"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-stone-700 hover:bg-[#FAF9F5] hover:text-[#5B6240] transition-colors"
                        >
                          <FiUser className="w-3.5 h-3.5" />
                          <span>My Profile & Orders</span>
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                        >
                          <FiLogOut className="w-3.5 h-3.5" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode("login");
                    setAuthModalOpen(true);
                  }}
                  className="p-2 text-stone-700 hover:text-[#5B6240] hover:bg-stone-50 rounded-none transition-colors hidden sm:inline-flex cursor-pointer"
                  title="Account / Login"
                  aria-label="User Account"
                >
                  <FiUser className="w-5 h-5" />
                </button>
              )}

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="relative p-2 text-stone-700 hover:text-[#5B6240] hover:bg-stone-50 rounded-full transition-colors"
                title="Wishlist"
                aria-label="Wishlist"
              >
                <FiHeart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-[#5B6240] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Shopping Bag / Cart */}
              <Link
                href="/cart"
                className="relative p-2 text-stone-700 hover:text-[#5B6240] hover:bg-stone-50 rounded-full transition-colors"
                title="Shopping Bag"
                aria-label="Cart"
              >
                <FiShoppingBag className="w-5 h-5" />
                <span className="absolute top-1 right-1 h-4 w-4 bg-[#5B6240] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>
      </div>

      {/* Mobile Slide-Out Navigation Sidebar Drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto visible"
            : "opacity-0 pointer-events-none invisible"
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        {/* Backdrop overlay */}
        <div
          className={`fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-300 ${
            mobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Sidebar Drawer */}
        <div
          className={`relative w-[85%] max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 transition-transform duration-300 ease-out transform ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Drawer Header with Logo & Close button */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center">
              <img
                src="/assets/images/eclera-logo.svg"
                alt="Eclera Cosmetics"
                className="h-8 w-auto object-contain"
              />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 -mr-2 text-stone-500 hover:text-stone-900 active:bg-stone-100 rounded-full transition-colors"
              aria-label="Close Menu"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content: ONLY 3 Menus (Home, Categories, Shop) */}
          <div className="flex-1 px-4 py-5 space-y-2 overflow-y-auto">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded text-xs font-bold tracking-wider uppercase transition-all ${
                pathname === "/"
                  ? "bg-[#5B6240] text-white shadow-xs"
                  : "text-stone-800 hover:bg-stone-50 hover:text-[#5B6240]"
              }`}
            >
              Home
            </Link>

            <Link
              href="/categories"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded text-xs font-bold tracking-wider uppercase transition-all ${
                pathname.startsWith("/categories")
                  ? "bg-[#5B6240] text-white shadow-xs"
                  : "text-stone-800 hover:bg-stone-50 hover:text-[#5B6240]"
              }`}
            >
              Categories
            </Link>

            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded text-xs font-bold tracking-wider uppercase transition-all ${
                pathname.startsWith("/shop")
                  ? "bg-[#5B6240] text-white shadow-xs"
                  : "text-stone-800 hover:bg-stone-50 hover:text-[#5B6240]"
              }`}
            >
              Shop
            </Link>
          </div>

          {/* Drawer Bottom Actions: Account & Social Media */}
          <div className="p-4 border-t border-[#ECECDA] bg-[#F9F9EB] space-y-3">
            {customer ? (
              <div className="space-y-2">
                <div className="px-3 py-2 bg-white border border-[#D0D7C4] rounded-none">
                  <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                    Logged In
                  </p>
                  <p className="text-xs font-bold text-stone-900 truncate">
                    {customer.fullName || "Customer"}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    +91 {customer.phone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full h-10 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-none flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
                >
                  <FiLogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalMode("login");
                  setAuthModalOpen(true);
                }}
                className="w-full h-10 bg-[#5B6240] hover:bg-[#474D32] text-white text-xs font-semibold rounded-none flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
              >
                <FiUser className="w-4 h-4" />
                <span>My Account / Login</span>
              </button>
            )}

            {/* Social Media Links */}
            <div className="flex items-center justify-center gap-3 pt-1 text-stone-600">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-full bg-white border border-[#D0D7C4] hover:bg-[#5B6240] hover:border-[#5B6240] hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs"
                aria-label="X (Twitter)"
              >
                <RiTwitterXFill className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-full bg-white border border-[#D0D7C4] hover:bg-[#5B6240] hover:border-[#5B6240] hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs"
                aria-label="Facebook"
              >
                <RiFacebookFill className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://pinterest.com"
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-full bg-white border border-[#D0D7C4] hover:bg-[#5B6240] hover:border-[#5B6240] hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs"
                aria-label="Pinterest"
              >
                <RiPinterestFill className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-full bg-white border border-[#D0D7C4] hover:bg-[#5B6240] hover:border-[#5B6240] hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs"
                aria-label="Instagram"
              >
                <RiInstagramLine className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* Login & Sign Up Modal (Dynamic Admin Banner, Mobile & Password, Zero Border Radius) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </>
  );
}
