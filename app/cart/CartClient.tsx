"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FiShoppingBag,
  FiTrash2,
  FiPlus,
  FiMinus,
  FiCheck,
  FiArrowRight,
  FiArrowLeft,
  FiTag,
  FiX,
  FiUploadCloud,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiCopy,
  FiChevronRight,
  FiShield,
  FiImage,
} from "react-icons/fi";
import { api } from "@/helper";
import { COUNTRIES, getStatesForCountry } from "@/helper/countries";

interface CartItem {
  _id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  image?: string;
  quantity: number;
}

interface Coupon {
  _id?: string;
  code: string;
  type?: "percentage" | "fixed";
  value?: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  description?: string;
  savingsDescription?: string;
  isEligible?: boolean;
  ineligibilityReason?: string;
  startDate?: string | null;
  endDate?: string | null;
}

function CartItemImage({ src, alt }: { src?: string; alt?: string }) {
  const [imgError, setImgError] = useState(false);

  if (!src || imgError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#FAF9F5] text-stone-400">
        <FiImage className="w-7 h-7 text-stone-400 stroke-[1.5]" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || "Product"}
      onError={() => setImgError(true)}
      className="w-full h-full object-cover"
    />
  );
}

export default function CartClient() {
  const searchParams = useSearchParams();

  // Cart Items State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);

  // Active Checkout Step: 1 = Bag, 2 = Address, 3 = Payment (QR), 4 = Confirmed
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Abandoned Cart Sync Identifier
  const [cartNumber, setCartNumber] = useState<string>("");

  // Customer & Shipping Form
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [country, setCountry] = useState("India");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Gujarat");
  const [pincode, setPincode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Coupon State
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    type?: string;
    value?: number;
    description?: string;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Coupon List Modal State ("View All Coupons")
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Payment QR & Proof Upload State
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>("");
  const [screenshotPreview, setScreenshotPreview] = useState<string>("");
  const [utrNumber, setUtrNumber] = useState<string>("");
  const [uploadingProof, setUploadingProof] = useState<boolean>(false);
  const [submittingOrder, setSubmittingOrder] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Placed Order Details
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);

  // 1. Load Cart from localStorage or URL Abandoned Cart
  useEffect(() => {
    try {
      const stored = localStorage.getItem("eclera_cart");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        }
      }

      // Check if recovering a specific abandoned cart from query params
      const urlCartNum = searchParams.get("cartNumber");
      if (urlCartNum) {
        setCartNumber(urlCartNum);
        api(`abandoned-cart/${urlCartNum}`, undefined, "GET").then((res) => {
          if (res?.status && res.data) {
            const data = res.data;
            if (Array.isArray(data.items) && data.items.length > 0) {
              const mapped = data.items.map((it: any) => ({
                _id: it.product || it._id,
                name: it.productName || "Product",
                slug: it.slug || "",
                price: it.price || 0,
                image: it.image || "",
                quantity: it.quantity || 1,
              }));
              setCartItems(mapped);
              localStorage.setItem("eclera_cart", JSON.stringify(mapped));
              window.dispatchEvent(new Event("eclera_cart_updated"));
            }
            if (data.customer) {
              if (data.customer.name) setCustomerName(data.customer.name);
              if (data.customer.email) setCustomerEmail(data.customer.email);
              if (data.customer.phone) setCustomerPhone(data.customer.phone);
            }
          }
        }).catch(() => null);
      }
    } catch (e) {
      console.error("Failed to parse cart items:", e);
    } finally {
      setCartLoaded(true);
    }
  }, [searchParams]);

  // 1b. Auto-fill Order Information from logged-in customer profile
  useEffect(() => {
    const fillProfileData = (cust: any) => {
      if (!cust) return;
      if (cust.fullName || cust.name) setCustomerName(cust.fullName || cust.name);
      if (cust.email) setCustomerEmail(cust.email);
      if (cust.phone || cust.mobileNumber) {
        const ph = String(cust.phone || cust.mobileNumber).replace(/[^0-9]/g, "").slice(-10);
        setCustomerPhone(ph);
      }
      if (cust.country) setCountry(cust.country);
      if (cust.state) setState(cust.state);
      if (cust.city) setCity(cust.city);
      if (cust.deliveryAddress || cust.addressLine1 || cust.street) {
        setStreetAddress(cust.deliveryAddress || cust.addressLine1 || cust.street);
      }
      if (cust.postalCode || cust.pincode) {
        setPincode(cust.postalCode || cust.pincode);
      }
    };

    const loadCustomerProfile = () => {
      try {
        const saved = localStorage.getItem("eclera_customer");
        if (saved) {
          const parsed = JSON.parse(saved);
          fillProfileData(parsed);

          // Fetch fresh updated profile from API if customer id is available
          const cid = parsed._id || parsed.id;
          if (cid) {
            api(`customer/profile?customerId=${cid}`, undefined, "GET")
              .then((res) => {
                if (res?.status && res.data) {
                  fillProfileData(res.data);
                  localStorage.setItem("eclera_customer", JSON.stringify({ ...parsed, ...res.data }));
                }
              })
              .catch(() => null);
          }
        }
      } catch (err) {
        console.error("Failed to load customer profile for checkout:", err);
      }
    };

    loadCustomerProfile();
    window.addEventListener("eclera_customer_auth_changed", loadCustomerProfile);
    window.addEventListener("storage", loadCustomerProfile);

    return () => {
      window.removeEventListener("eclera_customer_auth_changed", loadCustomerProfile);
      window.removeEventListener("storage", loadCustomerProfile);
    };
  }, []);

  // Synchronize cart items with localStorage
  const updateCartItemsState = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem("eclera_cart", JSON.stringify(items));
    window.dispatchEvent(new Event("eclera_cart_updated"));
  };

  // Quantity handlers
  const handleIncreaseQty = (index: number) => {
    const updated = [...cartItems];
    updated[index].quantity += 1;
    updateCartItemsState(updated);
  };

  const handleDecreaseQty = (index: number) => {
    const updated = [...cartItems];
    if (updated[index].quantity > 1) {
      updated[index].quantity -= 1;
      updateCartItemsState(updated);
    } else {
      handleRemoveItem(index);
    }
  };

  const handleRemoveItem = (index: number) => {
    const updated = cartItems.filter((_, i) => i !== index);
    updateCartItemsState(updated);
    if (updated.length === 0) {
      setAppliedCoupon(null);
    }
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    return appliedCoupon?.discountAmount || 0;
  }, [appliedCoupon]);

  const shippingFee = 0; // Free delivery offer

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + shippingFee);
  }, [subtotal, discountAmount, shippingFee]);

  // Re-verify coupon validity if subtotal drops
  useEffect(() => {
    if (appliedCoupon && subtotal > 0) {
      // Re-validate coupon
      api("order/validate-coupon", { code: appliedCoupon.code, subtotal }, "POST").then((res) => {
        if (!res?.status) {
          setAppliedCoupon(null);
          setCouponError(res?.message || "Coupon no longer eligible due to cart changes.");
        } else if (res.data?.discountAmount !== appliedCoupon.discountAmount) {
          setAppliedCoupon(res.data);
        }
      }).catch(() => null);
    }
  }, [subtotal]);

  // Background Abandoned Cart sync
  const syncAbandonedCart = (currentStep: string) => {
    if (cartItems.length === 0) return;
    const payload = {
      cartNumber: cartNumber || undefined,
      customer: {
        name: customerName || "Guest",
        email: customerEmail || "",
        phone: customerPhone || "",
      },
      items: cartItems,
      cartTotal: totalAmount,
      checkoutStep: currentStep,
    };
    api("abandoned-cart/sync", payload, "POST").then((res) => {
      if (res?.status && res.data?.cartNumber) {
        setCartNumber(res.data.cartNumber);
      }
    }).catch(() => null);
  };

  // Fetch Coupons for Modal via get_coupon_list
  const fetchAvailableCoupons = async () => {
    try {
      setLoadingCoupons(true);
      const res = await api(`get_coupon_list?subtotal=${subtotal}`, undefined, "GET");
      if (res?.status && Array.isArray(res.data)) {
        setAvailableCoupons(res.data);
      } else {
        setAvailableCoupons([]);
      }
    } catch (e) {
      console.error("Failed to load coupons:", e);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleOpenCouponModal = () => {
    setCouponModalOpen(true);
    fetchAvailableCoupons();
  };

  // Apply Coupon Logic
  const handleApplyCouponCode = async (codeToApply: string) => {
    const code = (codeToApply || "").trim().toUpperCase();
    if (!code) {
      // User clicked Apply without code -> show coupon modal list directly
      handleOpenCouponModal();
      return;
    }

    if (subtotal <= 0) {
      setCouponError("Add items to your bag first to apply coupons.");
      return;
    }

    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(null);

    try {
      const res = await api("order/validate-coupon", { code, subtotal }, "POST");
      if (res && res.status && res.data) {
        setAppliedCoupon(res.data);
        setCouponSuccess(res.message || `Coupon "${code}" applied successfully!`);
        setCouponInput("");
        setCouponModalOpen(false);
      } else {
        setCouponError(res?.message || "Invalid or ineligible coupon code.");
      }
    } catch (err: any) {
      setCouponError(err?.message || "Failed to validate coupon code.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponSuccess(null);
    setCouponError(null);
  };

  // Copy coupon code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Step 2 Form Submission
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim()) {
      setFormError("Full name is required.");
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 10) {
      setFormError("A valid 10-digit mobile number is required.");
      return;
    }
    if (!streetAddress.trim()) {
      setFormError("Delivery address is required.");
      return;
    }
    if (!country.trim()) {
      setFormError("Please select a country.");
      return;
    }
    if (!state.trim()) {
      setFormError("Please select or enter a state/province.");
      return;
    }
    if (!city.trim() || !pincode.trim()) {
      setFormError("City and Pincode are required.");
      return;
    }

    // Save to customer profile in background if customer is logged in
    try {
      const saved = localStorage.getItem("eclera_customer");
      if (saved) {
        const parsed = JSON.parse(saved);
        const cid = parsed._id || parsed.id;
        if (cid) {
          api("customer/profile", {
            customerId: cid,
            fullName: customerName.trim(),
            phone: customerPhone.trim(),
            email: customerEmail.trim(),
            country: country.trim(),
            state: state.trim(),
            city: city.trim(),
            postalCode: pincode.trim(),
            deliveryAddress: streetAddress.trim(),
          }, "POST").then((res) => {
            if (res?.status) {
              const updated = {
                ...parsed,
                fullName: customerName.trim(),
                phone: customerPhone.trim(),
                email: customerEmail.trim(),
                country: country.trim(),
                state: state.trim(),
                city: city.trim(),
                postalCode: pincode.trim(),
                deliveryAddress: streetAddress.trim(),
              };
              localStorage.setItem("eclera_customer", JSON.stringify(updated));
              window.dispatchEvent(new Event("eclera_customer_auth_changed"));
            }
          }).catch(() => null);
        }
      }
    } catch {}

    // Sync abandoned cart at payment_pending step
    syncAbandonedCart("payment_pending");
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle Payment Screenshot Upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPaymentError("Please upload an image file (JPG, PNG, or WEBP).");
      return;
    }

    setPaymentError(null);
    setUploadingProof(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setScreenshotPreview(base64Data);

      try {
        const uploadRes = await api("upload/payment-proof", {
          imageBase64: base64Data,
          fileName: file.name,
        }, "POST");

        if (uploadRes && uploadRes.status && uploadRes.data?.url) {
          setPaymentScreenshot(uploadRes.data.url);
        } else {
          // Direct base64 fallback
          setPaymentScreenshot(base64Data);
        }
      } catch {
        setPaymentScreenshot(base64Data);
      } finally {
        setUploadingProof(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Place Final Order with Screenshot Proof
  const handlePlaceOrder = async () => {
    if (!paymentScreenshot) {
      setPaymentError("Please upload your payment screenshot proof before confirming the order.");
      return;
    }

    setSubmittingOrder(true);
    setPaymentError(null);

    try {
      let customerId = undefined;
      try {
        const saved = localStorage.getItem("eclera_customer");
        if (saved) {
          const parsed = JSON.parse(saved);
          customerId = parsed._id || parsed.id;
        }
      } catch {}

      const orderPayload = {
        customer: {
          customerId,
          name: customerName.trim(),
          email: customerEmail.trim().toLowerCase(),
          phone: customerPhone.trim(),
        },
        shippingAddress: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          street: streetAddress.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: pincode.trim(),
          country: country.trim() || "India",
        },
        items: cartItems,
        subtotal,
        discountAmount,
        couponCode: appliedCoupon?.code || "",
        shippingFee,
        totalAmount,
        paymentScreenshot,
        utrNumber: utrNumber.trim(),
        cartNumber,
        notes: `QR Payment proof attached. Customer UTR: ${utrNumber || "N/A"}`,
      };

      const res = await api("order/create", orderPayload, "POST");

      if (res && res.status && res.data) {
        setPlacedOrder(res.data);
        // Clear Cart
        updateCartItemsState([]);
        setStep(4);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setPaymentError(res?.message || "Failed to place order. Please try again.");
      }
    } catch (err: any) {
      setPaymentError(err?.message || "An unexpected error occurred while placing order.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Generate dynamic UPI URL for QR code
  const upiUrl = useMemo(() => {
    const vpa = "8866002766@kotakbank";
    const name = encodeURIComponent("KHOKHANI PRIT GHANSHYAMBHAI");
    const note = encodeURIComponent("Order Payment");
    return `upi://pay?pa=${vpa}&pn=${name}&am=${totalAmount}&cu=INR&tn=${note}`;
  }, [totalAmount]);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    upiUrl
  )}&color=181615`;

  if (!cartLoaded) {
    return (
      <div className="w-full bg-[#FAF7F5] min-h-screen py-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#5B6240] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ----------------------------------------------------
  // STEP 4: ORDER CONFIRMED / SUCCESS SCREEN
  // ----------------------------------------------------
  if (step === 4 && placedOrder) {
    return (
      <div className="w-full bg-[#FAF7F5] min-h-screen pb-20 pt-8 sm:pt-12">
        <div className="max-w-[760px] mx-auto px-4 sm:px-6">
          <div className="bg-white border border-stone-200 shadow-sm p-6 sm:p-10 text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-[#5B6240]/10 text-[#5B6240] rounded-full flex items-center justify-center mx-auto mb-5">
              <FiCheckCircle className="w-9 h-9" />
            </div>

            <span className="text-[11px] font-bold tracking-widest text-[#5B6240] uppercase">
              Order Request Submitted
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1 mb-2 tracking-tight">
              Thank You For Your Order!
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto leading-relaxed">
              We have received your order request along with your payment screenshot proof. Our admin team will verify the payment and confirm your order shortly.
            </p>

            {/* Order Details Summary Box */}
            <div className="mt-8 p-5 bg-[#FAF9F5] border border-stone-200 text-left text-xs space-y-3">
              <div className="flex justify-between items-center pb-2.5 border-b border-stone-200">
                <span className="text-stone-500 font-medium">Order Number:</span>
                <span className="font-bold text-stone-900 text-sm">
                  {placedOrder.orderNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Order Status:</span>
                <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                  Pending Admin Confirmation
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Payment Proof:</span>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wider">
                  Screenshot Uploaded
                </span>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t border-stone-200">
                <span className="text-stone-500 font-medium">Total Paid:</span>
                <span className="font-bold text-stone-900 text-base">
                  ₹{Number(placedOrder.totalAmount || totalAmount).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Delivery Recipient Details */}
            <div className="mt-4 p-5 bg-white border border-stone-200 text-left text-xs space-y-1.5 text-stone-600">
              <p className="font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-2">
                Shipping To:
              </p>
              <p className="font-semibold text-stone-800">{placedOrder.customer?.name}</p>
              <p>{placedOrder.shippingAddress?.street}</p>
              <p>
                {placedOrder.shippingAddress?.city}, {placedOrder.shippingAddress?.state} -{" "}
                {placedOrder.shippingAddress?.postalCode}
              </p>
              <p>Phone: +91 {placedOrder.customer?.phone}</p>
            </div>

            {/* Action Button */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#5B6240] hover:bg-[#474D32] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
              >
                <span>Continue Shopping</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // EMPTY CART STATE
  // ----------------------------------------------------
  if (cartItems.length === 0) {
    return (
      <div className="w-full bg-[#FAF7F5] min-h-screen pb-20 pt-8 sm:pt-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-xs text-stone-500 font-medium mb-6">
            <Link href="/" className="hover:text-[#5B6240]">Home</Link>
            <FiChevronRight className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-stone-900 font-bold uppercase tracking-wider text-[11px]">Shopping Bag</span>
          </nav>

          <div className="bg-white border border-stone-200 p-12 sm:p-20 text-center max-w-xl mx-auto shadow-2xs">
            <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-2">
              Your Shopping Bag is Empty
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mb-6 max-w-sm mx-auto">
              Looks like you haven't added any botanical skincare formulations to your bag yet.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#5B6240] hover:bg-[#474D32] text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <span>Explore Products</span>
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FAF7F5] min-h-screen pb-20">
      {/* Top Breadcrumb */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-stone-500 font-medium">
            <Link href="/" className="hover:text-[#5B6240] transition-colors">
              Home
            </Link>
            <FiChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <Link href="/shop" className="hover:text-[#5B6240] transition-colors">
              Shop
            </Link>
            <FiChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="text-stone-900 font-semibold uppercase tracking-wider text-[11px]">
              {step === 1 ? "Bag" : step === 2 ? "Order" : "Payment"}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Step Progress Tracker */}
        <div className="mb-8">
          <div className="flex items-center justify-center max-w-xl mx-auto">
            {/* Step 1 */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ${
                  step >= 1 ? "bg-[#5B6240] text-white" : "bg-stone-200 text-stone-600"
                }`}
              >
                1
              </button>
              <span className={`ml-2 text-xs font-semibold uppercase tracking-wider hidden sm:inline ${
                step === 1 ? "text-[#5B6240]" : "text-stone-600"
              }`}>
                Bag
              </span>
            </div>

            <div className={`w-12 sm:w-20 h-0.5 mx-2 sm:mx-3 ${step >= 2 ? "bg-[#5B6240]" : "bg-stone-200"}`} />

            {/* Step 2 */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  if (cartItems.length > 0) setStep(2);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ${
                  step >= 2 ? "bg-[#5B6240] text-white" : "bg-stone-200 text-stone-600"
                }`}
              >
                2
              </button>
              <span className={`ml-2 text-xs font-semibold uppercase tracking-wider hidden sm:inline ${
                step === 2 ? "text-[#5B6240]" : "text-stone-600"
              }`}>
                Order
              </span>
            </div>

            <div className={`w-12 sm:w-20 h-0.5 mx-2 sm:mx-3 ${step >= 3 ? "bg-[#5B6240]" : "bg-stone-200"}`} />

            {/* Step 3 */}
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step >= 3 ? "bg-[#5B6240] text-white" : "bg-stone-200 text-stone-600"
                }`}
              >
                3
              </div>
              <span className={`ml-2 text-xs font-semibold uppercase tracking-wider hidden sm:inline ${
                step === 3 ? "text-[#5B6240]" : "text-stone-600"
              }`}>
                Payment
              </span>
            </div>
          </div>
        </div>

        {/* Main 2-Column Layout: Left (Process Step) + Right (Order Summary & Coupon) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ============================================================
              LEFT COLUMN: Active Step Content
             ============================================================ */}
          <div className="lg:col-span-7 space-y-6">
            {/* STEP 1: CART ITEMS REVIEW */}
            {step === 1 && (
              <div className="bg-white border border-stone-200 shadow-2xs">
                <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-bold text-stone-900 uppercase tracking-wider">
                    Bag Items ({cartItems.reduce((acc, it) => acc + it.quantity, 0)})
                  </h2>
                  <Link
                    href="/shop"
                    className="text-xs text-[#5B6240] hover:underline font-semibold"
                  >
                    + Add More Items
                  </Link>
                </div>

                <div className="divide-y divide-stone-100">
                  {cartItems.map((item, index) => (
                    <div key={`${item._id}-${index}`} className="p-4 sm:p-5 flex gap-4 items-center">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-stone-100 shrink-0 border border-stone-200 overflow-hidden">
                        <CartItemImage src={item.image} alt={item.name} />
                      </div>

                      {/* Info & Quantity */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/product/${item.slug}`}
                          className="text-xs sm:text-sm font-semibold text-stone-900 hover:text-[#5B6240] transition-colors line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs sm:text-sm font-bold text-stone-900">
                            ₹{Number(item.price).toLocaleString("en-IN")}
                          </span>
                          {item.comparePrice && item.comparePrice > item.price && (
                            <span className="text-[11px] text-stone-400 line-through">
                              ₹{Number(item.comparePrice).toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-3 mt-3">
                          <div className="inline-flex items-center border border-stone-200">
                            <button
                              type="button"
                              onClick={() => handleDecreaseQty(index)}
                              className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-100 cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <FiMinus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-stone-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleIncreaseQty(index)}
                              className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-100 cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <FiPlus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-stone-400 hover:text-red-600 text-xs flex items-center gap-1 cursor-pointer transition-colors p-1"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      </div>

                      {/* Total for item */}
                      <div className="text-right shrink-0">
                        <span className="text-xs sm:text-sm font-bold text-stone-900">
                          ₹{(Number(item.price) * Number(item.quantity)).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Action */}
                <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex justify-between items-center">
                  <span className="text-xs text-stone-600">
                    Subtotal: <strong className="text-stone-900">₹{subtotal.toLocaleString("en-IN")}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      syncAbandonedCart("contact_info");
                      setStep(2);
                    }}
                    className="px-6 py-3 bg-[#5B6240] hover:bg-[#474D32] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                  >
                    <span>Proceed To Order Info</span>
                    <FiArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: ORDER INFORMATION & SHIPPING FORM */}
            {step === 2 && (
              <form onSubmit={handleProceedToPayment} className="bg-white border border-stone-200 shadow-2xs p-5 sm:p-7 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <h2 className="text-sm sm:text-base font-bold text-stone-900 uppercase tracking-wider">
                    Order Information
                  </h2>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-[#5B6240] hover:underline flex items-center gap-1"
                  >
                    <FiArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Bag</span>
                  </button>
                </div>

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <FiAlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full h-11 px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-stone-300 focus:border-[#5B6240] focus:ring-1 focus:ring-[#5B6240] focus:outline-none transition-colors text-stone-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex h-11">
                      <span className="inline-flex items-center px-3.5 text-xs sm:text-sm bg-stone-100 border border-r-0 border-stone-300 text-stone-700 font-medium select-none">
                        {COUNTRIES.find((c) => c.name === country)?.phoneCode || "+91"}
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={15}
                        placeholder="Enter your mobile number"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
                        className="w-full h-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-stone-300 focus:border-[#5B6240] focus:ring-1 focus:ring-[#5B6240] focus:outline-none transition-colors text-stone-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                    Email Address <span className="text-stone-400 font-normal">(For order receipt)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email id"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full h-11 px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-stone-300 focus:border-[#5B6240] focus:ring-1 focus:ring-[#5B6240] focus:outline-none transition-colors text-stone-900"
                  />
                </div>

                {/* Country and State Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={country}
                      onChange={(e) => {
                        const newCountry = e.target.value;
                        setCountry(newCountry);
                        const states = getStatesForCountry(newCountry);
                        if (states.length > 0) {
                          setState(states[0]);
                        } else {
                          setState("");
                        }
                      }}
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
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                      State / Province <span className="text-red-500">*</span>
                    </label>
                    {getStatesForCountry(country).length > 0 ? (
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full h-11 px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-stone-300 focus:border-[#5B6240] focus:outline-none cursor-pointer transition-colors text-stone-900"
                      >
                        <option value="">Select state</option>
                        {getStatesForCountry(country).map((st) => (
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

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                    Street Address / Flat / House No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your address"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full h-11 px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-stone-300 focus:border-[#5B6240] focus:ring-1 focus:ring-[#5B6240] focus:outline-none transition-colors text-stone-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">
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
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                      Postal Code / PIN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      placeholder="Enter your postal code"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full h-11 px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-stone-300 focus:border-[#5B6240] focus:ring-1 focus:ring-[#5B6240] focus:outline-none transition-colors text-stone-900"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-200 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 border border-stone-300 text-stone-700 text-xs font-semibold uppercase tracking-wider hover:bg-stone-50 cursor-pointer"
                  >
                    Back to Bag
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#5B6240] hover:bg-[#474D32] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                  >
                    <span>Continue to Payment</span>
                    <FiArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: QR CODE PAYMENT & SCREENSHOT PROOF UPLOAD */}
            {step === 3 && (
              <div className="bg-white border border-stone-200 shadow-2xs p-5 sm:p-7 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-[#5B6240] uppercase">
                      Final Step
                    </span>
                    <h2 className="text-sm sm:text-base font-bold text-stone-900 uppercase tracking-wider">
                      Pay via UPI QR Code & Upload Proof
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs text-[#5B6240] hover:underline flex items-center gap-1"
                  >
                    <FiArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Order Info</span>
                  </button>
                </div>

                {paymentError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <FiAlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{paymentError}</span>
                  </div>
                )}

                {/* QR Code Presentation Box */}
                <div className="bg-[#FAF9F5] border border-stone-200 p-6 flex flex-col sm:flex-row items-center gap-6">
                  {/* Dynamic QR Code */}
                  <div className="bg-white p-3 border border-stone-200 shadow-xs shrink-0 flex flex-col items-center">
                    <img
                      src={qrImageUrl}
                      alt="UPI Payment QR Code"
                      className="w-44 h-44 object-contain"
                    />
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mt-2">
                      Scan To Pay
                    </span>
                  </div>

                  {/* Payment Details */}
                  <div className="flex-1 space-y-3 text-center sm:text-left">
                    <div>
                      <span className="text-[11px] text-stone-500 font-medium">Total Payable Amount</span>
                      <p className="text-2xl sm:text-3xl font-extrabold text-[#5B6240] tracking-tight">
                        ₹{totalAmount.toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="space-y-1 text-xs text-stone-700 bg-white p-3 border border-stone-200/80">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Merchant:</span>
                        <span className="font-semibold text-stone-900">KHOKHANI PRIT GHANSHYAMBHAI</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-stone-500">UPI ID:</span>
                        <span className="font-bold text-stone-900">8866002766@kotakbank</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      Scan with any UPI app (Google Pay, PhonePe, Paytm, BHIM, Cred) and pay the exact amount. After payment, upload the confirmation screenshot below.
                    </p>
                  </div>
                </div>

                {/* Upload Payment Screenshot Proof */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      Upload Payment Screenshot <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-stone-400">Required for Admin verification</span>
                  </div>

                  {!screenshotPreview ? (
                    <label className="border-2 border-dashed border-stone-300 hover:border-[#5B6240] p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer bg-stone-50/50 hover:bg-[#FAF9F5] transition-colors group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-stone-400 group-hover:text-[#5B6240] shadow-xs mb-3 transition-colors">
                        <FiUploadCloud className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                        Click to upload payment screenshot
                      </span>
                      <span className="text-[11px] text-stone-400 mt-1">
                        PNG, JPG, or WEBP (Max 10MB)
                      </span>
                    </label>
                  ) : (
                    <div className="border border-stone-200 bg-white p-4 flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative w-28 h-28 bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                        <img
                          src={screenshotPreview}
                          alt="Screenshot Proof Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="flex-1 space-y-1.5 text-center sm:text-left">
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <FiCheck className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-stone-900">
                            Screenshot Proof Attached
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500">
                          {uploadingProof
                            ? "Processing image..."
                            : "Screenshot verified and ready to submit with order."}
                        </p>

                        <div className="pt-2 flex gap-3 justify-center sm:justify-start">
                          <label className="text-xs text-[#5B6240] hover:underline cursor-pointer font-semibold">
                            Change Screenshot
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setScreenshotPreview("");
                              setPaymentScreenshot("");
                            }}
                            className="text-xs text-red-600 hover:underline cursor-pointer font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Optional UTR / Reference ID */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                      UPI Reference / UTR Number <span className="text-stone-400 font-normal">(Optional, helps faster verification)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your UTR number / transaction id"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-stone-300 focus:border-[#5B6240] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Final Confirm Order Button */}
                <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="text-xs text-stone-500 flex items-center gap-1.5">
                    <FiShield className="w-4 h-4 text-[#5B6240]" />
                    <span>Admin will verify payment and confirm order</span>
                  </div>

                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={submittingOrder || uploadingProof}
                    className="w-full sm:w-auto px-8 py-3.5 bg-[#5B6240] hover:bg-[#474D32] disabled:bg-stone-300 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors"
                  >
                    {submittingOrder ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting Order...</span>
                      </>
                    ) : (
                      <>
                        <FiCheck className="w-4 h-4" />
                        <span>Submit Order For Confirmation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================
              RIGHT COLUMN: Order Summary & Coupon Card
             ============================================================ */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Coupon Section */}
            <div className="bg-white border border-stone-200 shadow-2xs p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FiTag className="w-3.5 h-3.5 text-[#5B6240]" />
                  <span>Coupons & Offers</span>
                </span>
              </div>

              {/* If Coupon is already applied */}
              {appliedCoupon ? (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs">
                      <FiCheck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-900">
                        {appliedCoupon.code} APPLIED
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        You saved ₹{appliedCoupon.discountAmount}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs font-bold text-red-600 hover:underline cursor-pointer uppercase tracking-wider"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Coupon Code Input + Apply Button */}
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value);
                        setCouponError(null);
                        setCouponSuccess(null);
                      }}
                      className="flex-1 px-3 py-2 text-xs uppercase font-medium tracking-wider border border-stone-300 focus:border-[#5B6240] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCouponCode(couponInput)}
                      disabled={couponLoading}
                      className="px-5 py-2 bg-[#5B6240] hover:bg-[#474D32] disabled:bg-stone-300 text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      {couponLoading ? "Checking..." : "Apply"}
                    </button>
                  </div>

                  {couponSuccess && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <FiCheck className="w-3.5 h-3.5" />
                      <span>{couponSuccess}</span>
                    </p>
                  )}

                  {couponError && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <FiAlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{couponError}</span>
                    </p>
                  )}

                  {/* "You don't have any coupon? View all" Link */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-500">You don't have any coupon?</span>
                    <button
                      type="button"
                      onClick={handleOpenCouponModal}
                      className="text-[#5B6240] hover:text-[#474D32] font-bold uppercase tracking-wider text-[11px] hover:underline cursor-pointer"
                    >
                      View All Coupons
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Order Summary Card */}
            <div className="bg-white border border-stone-200 shadow-2xs p-5 space-y-4">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider pb-3 border-b border-stone-200">
                Order Summary
              </h3>

              <div className="space-y-2.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Bag Subtotal ({cartItems.reduce((acc, it) => acc + it.quantity, 0)} items)</span>
                  <span className="font-semibold text-stone-900">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Coupon Savings ({appliedCoupon?.code})</span>
                    <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>Shipping & Delivery</span>
                  <span className="text-emerald-700 font-bold uppercase text-[11px]">Free Delivery</span>
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                    Total Amount
                  </span>
                  <span className="text-xl font-extrabold text-[#5B6240]">
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Step Navigation / Information */}
              <div className="pt-3 text-[11px] text-stone-500 flex items-center gap-1.5 border-t border-stone-100">
                <FiClock className="w-3.5 h-3.5 text-[#5B6240]" />
                <span>Orders confirmed within 15 minutes of payment verification</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          VIEW ALL COUPONS MODAL POPUP
         ============================================================ */}
      {couponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 transition-opacity backdrop-blur-xs"
            onClick={() => setCouponModalOpen(false)}
          />

          {/* Modal Dialog */}
          <div className="relative w-full max-w-lg bg-white shadow-2xl rounded-none z-10 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <FiTag className="w-4 h-4 text-[#5B6240]" />
                <h3 className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wider">
                  Available Coupons ({availableCoupons.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCouponModalOpen(false)}
                className="text-stone-400 hover:text-stone-900 cursor-pointer p-1"
                aria-label="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Coupons List Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loadingCoupons ? (
                <div className="py-12 text-center text-xs text-stone-500 space-y-2">
                  <div className="w-6 h-6 border-2 border-[#5B6240] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Loading active coupons...</p>
                </div>
              ) : availableCoupons.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-500">
                  <p>No active public coupons found right now.</p>
                </div>
              ) : (
                availableCoupons.map((c) => {
                  const minRequired = Number(c.minOrderValue) || 0;
                  const isEligible = subtotal >= minRequired;
                  const diff = minRequired - subtotal;
                  const isCurrentlyApplied = appliedCoupon?.code === c.code;

                  return (
                    <div
                      key={c.code}
                      className={`border p-4 transition-all relative ${
                        isCurrentlyApplied
                          ? "border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500"
                          : isEligible
                          ? "border-stone-200 bg-white hover:border-[#5B6240]"
                          : "border-stone-200 bg-stone-50/60 opacity-80"
                      }`}
                    >
                      {/* Top Row: Code Badge + Action Button */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 font-bold text-xs bg-stone-100 text-stone-900 border border-dashed border-stone-400 uppercase tracking-wider">
                            {c.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(c.code)}
                            title="Copy code"
                            className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer text-xs"
                          >
                            {copiedCode === c.code ? (
                              <span className="text-[10px] text-emerald-600 font-bold">COPIED</span>
                            ) : (
                              <FiCopy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Apply / Applied Button */}
                        {isCurrentlyApplied ? (
                          <span className="text-xs font-bold text-emerald-700 uppercase flex items-center gap-1">
                            <FiCheck className="w-3.5 h-3.5" />
                            Applied
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={!isEligible}
                            onClick={() => handleApplyCouponCode(c.code)}
                            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                              isEligible
                                ? "bg-[#5B6240] hover:bg-[#474D32] text-white shadow-xs"
                                : "bg-stone-200 text-stone-400 cursor-not-allowed"
                            }`}
                          >
                            Apply
                          </button>
                        )}
                      </div>

                      {/* Coupon Discount Details description formatted from admin panel rules */}
                      <div className="mt-2.5 space-y-1">
                        <p className="text-xs font-bold text-stone-900">
                          {c.savingsDescription ||
                            (c.type === "percentage"
                              ? `Get ${c.value}% OFF${
                                  c.maxDiscountAmount && c.maxDiscountAmount > 0
                                    ? ` up to ₹${c.maxDiscountAmount}`
                                    : ""
                                }`
                              : `Flat ₹${c.value} OFF`)}
                        </p>

                        {c.description ? (
                          <p className="text-xs text-stone-600 leading-snug">
                            {c.description}
                          </p>
                        ) : null}

                        {/* Eligibility Points */}
                        <div className="pt-2 text-[11px] space-y-1">
                          {minRequired > 0 && (
                            <p className="text-stone-500 font-medium">
                              • Minimum cart value: <strong>₹{minRequired}</strong>
                            </p>
                          )}

                          {/* If NOT eligible, show exact required reason */}
                          {!isEligible && (
                            <p className="text-amber-700 font-semibold bg-amber-50 px-2 py-1 border border-amber-200">
                              ⚠ Not Eligible: Add ₹{diff} more items to your bag to unlock this offer (Current total: ₹{subtotal}).
                            </p>
                          )}

                          {isEligible && !isCurrentlyApplied && (
                            <p className="text-emerald-700 font-medium">
                              ✓ Your cart is eligible for this coupon!
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-stone-200 bg-stone-50 flex justify-between items-center text-xs">
              <span className="text-stone-500">
                Cart Total: <strong className="text-stone-900">₹{subtotal.toLocaleString("en-IN")}</strong>
              </span>
              <button
                type="button"
                onClick={() => setCouponModalOpen(false)}
                className="px-4 py-1.5 border border-stone-300 text-stone-700 font-semibold uppercase text-[11px] hover:bg-stone-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
