"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FiUser,
  FiMapPin,
  FiPackage,
  FiCheck,
  FiAlertCircle,
  FiLock,
  FiChevronRight,
  FiGlobe,
  FiLogOut,
  FiClock,
  FiShield,
  FiShoppingBag,
  FiImage,
} from "react-icons/fi";
import { api, deleteCookie } from "@/helper";
import { COUNTRIES, getStatesForCountry } from "@/helper/countries";

type TabType = "personal" | "address" | "orders";

function OrderItemImage({ src, alt }: { src?: string; alt?: string }) {
  const [imgError, setImgError] = useState(false);

  if (!src || imgError) {
    return (
      <div className="w-14 h-14 bg-[#FAF9F5] border border-stone-200 flex items-center justify-center text-stone-400 shrink-0">
        <FiImage className="w-5 h-5 text-stone-400 stroke-[1.5]" />
      </div>
    );
  }

  return (
    <div className="w-14 h-14 bg-stone-100 border border-stone-200 shrink-0 overflow-hidden">
      <img
        src={src}
        alt={alt || "Product"}
        onError={() => setImgError(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export default function AccountClient() {
  const [customer, setCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("personal");

  // Personal Details Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Delivery Address Form State
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("Gujarat");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Feedback states
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Fetch Customer Orders
  const fetchCustomerOrders = async (cust: any) => {
    if (!cust) return;
    setLoadingOrders(true);
    try {
      const cid = cust._id || cust.id || "";
      const ph = cust.phone || "";
      const em = cust.email || "";
      const res = await api(
        `customer/orders?customerId=${encodeURIComponent(cid)}&phone=${encodeURIComponent(ph)}&email=${encodeURIComponent(em)}`,
        undefined,
        "GET"
      );
      if (res?.status && Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Failed to load customer orders:", err);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Populate form with customer details
  const fillCustomerData = (d: any) => {
    if (!d) return;
    setCustomer(d);
    if (d.fullName || d.name) setFullName(d.fullName || d.name);
    if (d.phone || d.mobileNumber) {
      const ph = String(d.phone || d.mobileNumber).replace(/[^0-9]/g, "").slice(-10);
      setPhone(ph);
    }
    if (d.email) setEmail(d.email);
    if (d.country) setCountry(d.country);
    if (d.state) setState(d.state);
    if (d.city) setCity(d.city);
    if (d.postalCode || d.pincode) setPostalCode(d.postalCode || d.pincode);
    if (d.deliveryAddress || d.addressLine1 || d.street) {
      setStreetAddress(d.deliveryAddress || d.addressLine1 || d.street);
    }
  };

  // 1. Load logged-in customer data & auto-fill profile
  useEffect(() => {
    const loadCustomer = () => {
      try {
        const saved = localStorage.getItem("eclera_customer");
        if (saved) {
          const parsed = JSON.parse(saved);
          fillCustomerData(parsed);
          fetchCustomerOrders(parsed);

          // Fetch fresh latest profile from API
          const cid = parsed._id || parsed.id;
          if (cid) {
            api(`customer/profile?customerId=${cid}`, undefined, "GET")
              .then((res) => {
                if (res && res.status && res.data) {
                  fillCustomerData(res.data);
                  localStorage.setItem("eclera_customer", JSON.stringify({ ...parsed, ...res.data }));
                  fetchCustomerOrders(res.data);
                }
              })
              .catch(() => null);
          }
        } else {
          setCustomer(null);
          setOrders([]);
        }
      } catch {
        // not logged in
      } finally {
        setLoading(false);
      }
    };

    loadCustomer();
    window.addEventListener("eclera_customer_auth_changed", loadCustomer);
    window.addEventListener("storage", loadCustomer);

    return () => {
      window.removeEventListener("eclera_customer_auth_changed", loadCustomer);
      window.removeEventListener("storage", loadCustomer);
    };
  }, []);

  // Handle Country Change
  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    const available = getStatesForCountry(newCountry);
    if (available.length > 0) {
      setState(available[0]);
    } else {
      setState("");
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("eclera_customer");
    localStorage.removeItem("eclera_customer_token");
    deleteCookie("eclera_customer_token");
    setCustomer(null);
    window.dispatchEvent(new Event("eclera_customer_auth_changed"));
  };

  // Save Personal Details or Delivery Address
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const payload = {
        customerId: customer?._id || customer?.id,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        country: country.trim() || "India",
        state: state.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        deliveryAddress: streetAddress.trim(),
      };

      const res = await api("customer/profile", payload, "POST");

      if (res && res.status) {
        setSuccessMsg(
          activeTab === "personal"
            ? "Your personal details have been updated successfully!"
            : "Your delivery address has been saved successfully!"
        );
        const updated = {
          ...(customer || {}),
          ...payload,
        };
        setCustomer(updated);
        localStorage.setItem("eclera_customer", JSON.stringify(updated));
        window.dispatchEvent(new Event("eclera_customer_auth_changed"));
      } else {
        setErrorMsg(res?.message || "Failed to update details. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-[#FAF7F5] min-h-screen py-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#5B6240] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in gate
  if (!customer) {
    return (
      <div className="w-full bg-[#FAF7F5] min-h-screen py-20">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white border border-stone-200 p-8 shadow-xs space-y-4">
            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-[#5B6240]">
              <FiUser className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-stone-900 uppercase tracking-wider">
              Sign In to Your Account
            </h2>
            <p className="text-xs text-stone-600">
              Please sign in to manage your saved delivery address, view order history, and access exclusive member offers.
            </p>
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("eclera_open_auth_modal", { detail: { mode: "login" } })
                );
              }}
              className="w-full py-3 bg-[#5B6240] hover:bg-[#474D32] text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Sign In / Register
            </button>
            <div className="pt-2">
              <Link
                href="/shop"
                className="text-xs text-stone-500 hover:text-[#5B6240] hover:underline"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const availableStates = getStatesForCountry(country);

  // Status Badge Helper - Strict 5 Flow Statuses (Pending -> Confirmed -> Shipped -> Delivered -> Returned)
  const getStatusBadge = (status: string) => {
    const s = String(status || "pending").toLowerCase();
    switch (s) {
      case "confirmed":
        return {
          bg: "bg-sky-50 text-sky-700 border-sky-200",
          label: "Confirmed",
        };
      case "shipped":
        return {
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          label: "Shipped",
        };
      case "delivered":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          label: "Delivered",
        };
      case "returned":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          label: "Returned",
        };
      case "pending":
      default:
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          label: "Pending",
        };
    }
  };

  return (
    <div className="w-full bg-[#FAF7F5] min-h-screen pb-24">
      {/* Top Breadcrumb */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-stone-500 font-medium">
            <Link href="/" className="hover:text-[#5B6240] transition-colors">
              Home
            </Link>
            <FiChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="text-stone-900 font-semibold uppercase tracking-wider text-[11px]">
              My Account
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* 2-Column Responsive Layout: Left Sidebar (3 cols) + Right Content (9 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* LEFT SIDEBAR TABS */}
          <div className="lg:col-span-3 bg-white border border-stone-200 shadow-2xs divide-y divide-stone-100">
            {/* Vertical Navigation Tabs */}
            <nav className="p-2 space-y-1">
              {/* Tab 1: Personal Details */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("personal");
                  setSuccessMsg(null);
                  setErrorMsg(null);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "personal"
                    ? "bg-[#5B6240] text-white shadow-xs"
                    : "text-stone-700 hover:bg-[#FAF9F5] hover:text-[#5B6240]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <FiUser className="w-4 h-4" />
                  <span>Personal Details</span>
                </div>
                <FiChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    activeTab === "personal" ? "text-white" : "text-stone-400"
                  }`}
                />
              </button>

              {/* Tab 2: Delivery Address */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("address");
                  setSuccessMsg(null);
                  setErrorMsg(null);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "address"
                    ? "bg-[#5B6240] text-white shadow-xs"
                    : "text-stone-700 hover:bg-[#FAF9F5] hover:text-[#5B6240]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <FiMapPin className="w-4 h-4" />
                  <span>Delivery Address</span>
                </div>
                <FiChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    activeTab === "address" ? "text-white" : "text-stone-400"
                  }`}
                />
              </button>

              {/* Tab 3: Orders */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("orders");
                  setSuccessMsg(null);
                  setErrorMsg(null);
                  fetchCustomerOrders(customer);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "orders"
                    ? "bg-[#5B6240] text-white shadow-xs"
                    : "text-stone-700 hover:bg-[#FAF9F5] hover:text-[#5B6240]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <FiPackage className="w-4 h-4" />
                  <span>Orders</span>
                </div>
                <div className="flex items-center gap-2">
                  {orders.length > 0 && (
                    <span
                      className={`w-5 h-5 min-w-[20px] rounded-full flex items-center justify-center text-[10px] font-semibold leading-none aspect-square shrink-0 ${
                        activeTab === "orders"
                          ? "bg-white/25 text-white"
                          : "bg-stone-200 text-stone-700"
                      }`}
                    >
                      {orders.length}
                    </span>
                  )}
                  <FiChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      activeTab === "orders" ? "text-white" : "text-stone-400"
                    }`}
                  />
                </div>
              </button>
            </nav>

            {/* Logout Action at Bottom of Sidebar */}
            <div className="p-3">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <FiLogOut className="w-4 h-4 text-red-500" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* RIGHT CONTENT PANEL */}
          <div className="lg:col-span-9 bg-white border border-stone-200 shadow-2xs p-5 sm:p-7 md:p-8">
            {successMsg && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <FiCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <FiAlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ==================================================================== */}
            {/* TAB 1: PERSONAL DETAILS */}
            {/* ==================================================================== */}
            {activeTab === "personal" && (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="border-b border-stone-200 pb-3">
                  <h2 className="text-base font-semibold text-stone-900 uppercase tracking-wider">
                    Personal Details
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Your personal information is securely stored and used for order confirmations.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700 uppercase tracking-wide">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-11 px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-stone-300 focus:border-[#5B6240] focus:ring-1 focus:ring-[#5B6240] focus:outline-none transition-colors text-stone-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700 uppercase tracking-wide flex items-center justify-between">
                      <span>Mobile Number</span>
                      {customer.phone && (
                        <span className="text-[10px] text-stone-400 font-normal flex items-center gap-1">
                          <FiLock className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </label>
                    <input
                      type="tel"
                      disabled={!!customer.phone}
                      placeholder="Enter your mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full h-11 px-3.5 py-2.5 text-xs sm:text-sm border border-stone-300 bg-stone-50 text-stone-600 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700 uppercase tracking-wide flex items-center justify-between">
                      <span>Email Address</span>
                      {customer.email && (
                        <span className="text-[10px] text-stone-400 font-normal flex items-center gap-1">
                          <FiLock className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </label>
                    <input
                      type="email"
                      disabled={!!customer.email}
                      placeholder="Enter your email id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 px-3.5 py-2.5 text-xs sm:text-sm border border-stone-300 bg-stone-50 text-stone-600 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-200 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 bg-[#5B6240] hover:bg-[#474D32] disabled:bg-stone-300 text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                  >
                    {saving ? "Updating..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}

            {/* ==================================================================== */}
            {/* TAB 2: DELIVERY ADDRESS */}
            {/* ==================================================================== */}
            {activeTab === "address" && (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="border-b border-stone-200 pb-3">
                  <h2 className="text-base font-semibold text-stone-900 uppercase tracking-wider">
                    Delivery Address
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    This address will be automatically selected during your checkout.
                  </p>
                </div>

                {/* Country and State Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700 uppercase tracking-wide flex items-center gap-1.5">
                      <FiGlobe className="w-3.5 h-3.5 text-[#5B6240]" />
                      <span>Country</span> <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full h-11 px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-stone-300 focus:border-[#5B6240] focus:outline-none cursor-pointer transition-colors text-stone-900"
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700 uppercase tracking-wide">
                      State / Province <span className="text-red-500">*</span>
                    </label>
                    {availableStates.length > 0 ? (
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full h-11 px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-stone-300 focus:border-[#5B6240] focus:outline-none cursor-pointer transition-colors text-stone-900"
                      >
                        <option value="">Select state</option>
                        {availableStates.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        placeholder="Select state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full h-11 px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-stone-300 focus:border-[#5B6240] focus:ring-1 focus:ring-[#5B6240] focus:outline-none transition-colors text-stone-900"
                      />
                    )}
                  </div>
                </div>

                {/* Street Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700 uppercase tracking-wide">
                    Street Address / Flat / Landmark <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Enter your address"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-stone-300 focus:border-[#5B6240] focus:ring-1 focus:ring-[#5B6240] focus:outline-none transition-colors text-stone-900"
                  />
                </div>

                {/* City and Postal Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700 uppercase tracking-wide">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full h-11 px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-stone-300 focus:border-[#5B6240] focus:ring-1 focus:ring-[#5B6240] focus:outline-none transition-colors text-stone-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700 uppercase tracking-wide">
                      Postal Code / PIN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      placeholder="Enter your postal code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full h-11 px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-stone-300 focus:border-[#5B6240] focus:ring-1 focus:ring-[#5B6240] focus:outline-none transition-colors text-stone-900"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-200 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 bg-[#5B6240] hover:bg-[#474D32] disabled:bg-stone-300 text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                  >
                    {saving ? "Saving Address..." : "Save Delivery Address"}
                  </button>
                </div>
              </form>
            )}

            {/* ==================================================================== */}
            {/* TAB 3: ORDERS */}
            {/* ==================================================================== */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-stone-900 uppercase tracking-wider">
                      My Orders
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Review your order history, delivery status, and invoice totals.
                    </p>
                  </div>
                  {orders.length > 0 && (
                    <span className="text-xs font-semibold text-[#5B6240] uppercase tracking-wider">
                      {orders.length} {orders.length === 1 ? "Order" : "Orders"}
                    </span>
                  )}
                </div>

                {loadingOrders ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-[#5B6240] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-stone-500">Loading your orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  /* Empty State */
                  <div className="py-16 text-center space-y-4 bg-stone-50 border border-dashed border-stone-300 p-8">
                    <div className="w-14 h-14 bg-white border border-stone-200 rounded-full flex items-center justify-center mx-auto text-[#5B6240] shadow-2xs">
                      <FiPackage className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider">
                        No Orders Yet
                      </h3>
                      <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                        You have not placed any orders yet. Discover our luxury clean formulations and start shopping.
                      </p>
                    </div>
                    <Link
                      href="/shop"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#5B6240] hover:bg-[#474D32] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
                    >
                      <FiShoppingBag className="w-4 h-4" />
                      <span>Explore Products</span>
                    </Link>
                  </div>
                ) : (
                  /* Orders List */
                  <div className="space-y-5">
                    {orders.map((ord: any) => {
                      const badge = getStatusBadge(ord.orderStatus || ord.status);
                      const formattedDate = ord.createdAt
                        ? new Date(ord.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Recent";

                      return (
                        <div
                          key={ord._id || ord.orderNumber}
                          className="border border-stone-200 overflow-hidden shadow-2xs bg-white transition-all hover:border-stone-300"
                        >
                          {/* Order Header */}
                          <div className="p-4 sm:p-5 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-stone-900">
                                  #{ord.orderNumber}
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 border text-[10px] font-semibold uppercase tracking-wider ${badge.bg}`}
                                >
                                  {badge.label}
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-500 flex items-center gap-1">
                                <FiClock className="w-3.5 h-3.5 text-stone-400" />
                                <span>{formattedDate}</span>
                              </p>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-stone-500 uppercase tracking-wider block">
                                Total Paid
                              </span>
                              <span className="text-sm sm:text-base font-bold text-[#5B6240]">
                                ₹{(ord.totalAmount || 0).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>

                          {/* Order Items */}
                          <div className="p-4 sm:p-5 divide-y divide-stone-100">
                            {Array.isArray(ord.items) &&
                              ord.items.map((item: any, idx: number) => {
                                return (
                                  <div
                                    key={idx}
                                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                                  >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                      <OrderItemImage
                                        src={item.image}
                                        alt={item.productName || item.name || "Product"}
                                      />
                                      <div className="min-w-0">
                                        <p
                                          title={item.productName || item.name}
                                          className="text-xs font-semibold text-stone-900 truncate"
                                        >
                                          {item.productName || item.name}
                                        </p>
                                        <p className="text-[11px] text-stone-500 mt-0.5">
                                          Qty: {item.quantity || 1} × ₹
                                          {(item.price || 0).toLocaleString("en-IN")}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                      <span className="text-xs font-semibold text-stone-900">
                                        ₹
                                        {(
                                          (item.price || 0) * (item.quantity || 1)
                                        ).toLocaleString("en-IN")}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>

                          {/* Order Footer with Address & Payment Method */}
                          <div className="p-4 bg-[#FAF9F5] border-t border-stone-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-stone-600">
                            <div className="space-y-0.5">
                              <span className="font-semibold text-stone-800 text-[11px] uppercase tracking-wider block">
                                Shipping Address:
                              </span>
                              <p className="text-[11px] text-stone-600">
                                {ord.shippingAddress?.street && `${ord.shippingAddress.street}, `}
                                {ord.shippingAddress?.city && `${ord.shippingAddress.city}, `}
                                {ord.shippingAddress?.state && `${ord.shippingAddress.state} `}
                                {ord.shippingAddress?.postalCode && `- ${ord.shippingAddress.postalCode}`}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 bg-white border border-stone-200 text-[11px] font-medium text-stone-700 flex items-center gap-1.5 shadow-2xs">
                                <FiShield className="w-3.5 h-3.5 text-[#5B6240]" />
                                <span>UPI QR Payment</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
