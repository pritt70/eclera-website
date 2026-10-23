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
} from "react-icons/fi";
import {
  RiTwitterXFill,
  RiFacebookFill,
  RiPinterestFill,
  RiInstagramLine,
} from "react-icons/ri";
import { AnnouncementBar } from "./AnnouncementBar";

export function Header() {
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);
  const [wishlistCount, setWishlistCount] = useState<number>(0);
  const [isScrolled, setIsScrolled] = useState(false);

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
      {/* Top Announcement Bar */}
      <AnnouncementBar />

      {/* Main Header */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-xs border-b border-stone-200"
            : "bg-white border-b border-stone-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
            {/* Left: Mobile Toggle Menu Button (Mobile & Tablet only) */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 -ml-2 text-stone-800 hover:text-[#B4395A] active:bg-stone-100 rounded-lg transition-colors focus:outline-none"
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

            {/* Simple Desktop Navigation Links: Home, Collections, Shop */}
            <nav className="hidden lg:flex items-center space-x-10">
              <Link
                href="/"
                className={`text-xs font-semibold tracking-wider uppercase transition-colors hover:text-[#B4395A] ${
                  pathname === "/" ? "text-[#B4395A] font-bold" : "text-stone-700"
                }`}
              >
                Home
              </Link>

              <Link
                href="/collections"
                className={`text-xs font-semibold tracking-wider uppercase transition-colors hover:text-[#B4395A] ${
                  pathname.startsWith("/collections") ? "text-[#B4395A] font-bold" : "text-stone-700"
                }`}
              >
                Collections
              </Link>

              <Link
                href="/shop"
                className={`text-xs font-semibold tracking-wider uppercase transition-colors hover:text-[#B4395A] ${
                  pathname.startsWith("/shop") ? "text-[#B4395A] font-bold" : "text-stone-700"
                }`}
              >
                Shop
              </Link>
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center space-x-1.5 sm:space-x-3 text-stone-700">
              {/* User Account (Desktop & Tablet) */}
              <Link
                href="/account"
                className="p-2 text-stone-700 hover:text-[#B4395A] hover:bg-stone-50 rounded-full transition-colors hidden sm:inline-flex"
                title="Account / Login"
                aria-label="User Account"
              >
                <FiUser className="w-5 h-5" />
              </Link>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="relative p-2 text-stone-700 hover:text-[#B4395A] hover:bg-stone-50 rounded-full transition-colors"
                title="Wishlist"
                aria-label="Wishlist"
              >
                <FiHeart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-[#B4395A] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Shopping Bag / Cart */}
              <Link
                href="/cart"
                className="relative p-2 text-stone-700 hover:text-[#B4395A] hover:bg-stone-50 rounded-full transition-colors"
                title="Shopping Bag"
                aria-label="Cart"
              >
                <FiShoppingBag className="w-5 h-5" />
                <span className="absolute top-1 right-1 h-4 w-4 bg-[#B4395A] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

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

          {/* Drawer Content: ONLY 3 Menus (Home, Collections, Shop) */}
          <div className="flex-1 px-4 py-5 space-y-2 overflow-y-auto">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded text-xs font-bold tracking-wider uppercase transition-all ${
                pathname === "/"
                  ? "bg-[#B4395A] text-white shadow-xs"
                  : "text-stone-800 hover:bg-stone-50 hover:text-[#B4395A]"
              }`}
            >
              Home
            </Link>

            <Link
              href="/collections"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded text-xs font-bold tracking-wider uppercase transition-all ${
                pathname.startsWith("/collections")
                  ? "bg-[#B4395A] text-white shadow-xs"
                  : "text-stone-800 hover:bg-stone-50 hover:text-[#B4395A]"
              }`}
            >
              Collections
            </Link>

            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded text-xs font-bold tracking-wider uppercase transition-all ${
                pathname.startsWith("/shop")
                  ? "bg-[#B4395A] text-white shadow-xs"
                  : "text-stone-800 hover:bg-stone-50 hover:text-[#B4395A]"
              }`}
            >
              Shop
            </Link>
          </div>

          {/* Drawer Bottom Actions: Account & Social Media */}
          <div className="p-4 border-t border-stone-200 bg-[#FAF7F2] space-y-3">
            <Link
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full h-10 bg-[#B4395A] hover:bg-[#9b2f4c] text-white text-xs font-semibold rounded flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <FiUser className="w-4 h-4" />
              <span>My Account / Login</span>
            </Link>

            {/* Social Media Links */}
            <div className="flex items-center justify-center gap-3 pt-1 text-stone-600">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-full bg-white border border-stone-300 hover:text-[#B4395A] flex items-center justify-center transition-colors shadow-2xs"
                aria-label="X (Twitter)"
              >
                <RiTwitterXFill className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-full bg-white border border-stone-300 hover:text-[#B4395A] flex items-center justify-center transition-colors shadow-2xs"
                aria-label="Facebook"
              >
                <RiFacebookFill className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://pinterest.com"
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-full bg-white border border-stone-300 hover:text-[#B4395A] flex items-center justify-center transition-colors shadow-2xs"
                aria-label="Pinterest"
              >
                <RiPinterestFill className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-full bg-white border border-stone-300 hover:text-[#B4395A] flex items-center justify-center transition-colors shadow-2xs"
                aria-label="Instagram"
              >
                <RiInstagramLine className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
