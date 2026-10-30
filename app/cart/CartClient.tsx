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
  FiLock,
  FiExternalLink,
  FiStar,
  FiTruck,
} from "react-icons/fi";
import {
  RiWhatsappLine,
  RiSparklingLine,
  RiLeafLine,
  RiShieldCheckLine,
} from "react-icons/ri";
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
  const [selectedProof, setSelectedProof] = useState<{ base64: string; fileName: string } | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>("");
  const [utrNumber, setUtrNumber] = useState<string>("");
  const [submittingOrder, setSubmittingOrder] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);

  // Empty Cart Recommendations & Categories
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState<boolean>(false);

  // Load recommendations and categories when cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      setLoadingRecommendations(true);
      api("products", undefined, "GET")
        .then((res) => {
          if (res?.status && Array.isArray(res.data)) {
            setRecommendedProducts(res.data.slice(0, 4));
          }
        })
        .catch(() => null)
        .finally(() => setLoadingRecommendations(false));

      api("categories", undefined, "GET")
        .then((res) => {
          if (res?.status && Array.isArray(res.data)) {
            setCategoriesList(res.data.slice(0, 6));
          }
        })
        .catch(() => null);
    }
  }, [cartItems.length]);

  // Placed Order Details
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);

  // 1.0 Live Order Status Polling from Database (Auto-refreshes when Admin updates status)
  useEffect(() => {
    if (step !== 4 || !placedOrder?.orderNumber) return;

    let isMounted = true;
    const fetchLatestStatus = async () => {
      try {
        const res = await api(`order/status/${placedOrder.orderNumber}`, undefined, "GET");
        if (isMounted && res?.status && res?.data) {
          setPlacedOrder((prev: any) => ({
            ...prev,
            ...res.data,
          }));
        }
      } catch (e) {
        // Silent catch for background polling
      }
    };

    fetchLatestStatus();
    const interval = setInterval(fetchLatestStatus, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [step, placedOrder?.orderNumber]);

  const getOrderStatusBadge = (st?: string) => {
    const s = (st || "pending").toLowerCase();
    switch (s) {
      case "delivered":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-[2px] text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
            Delivered
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-[2px] text-[10px] sm:text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wide">
            Shipped
          </span>
        );
      case "confirmed":
      case "success":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-[2px] text-[10px] sm:text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wide">
            Confirmed
          </span>
        );
      case "returned":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-[2px] text-[10px] sm:text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wide">
            Returned
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-[2px] text-[10px] sm:text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-200 uppercase tracking-wide">
            Cancelled
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-[2px] text-[10px] sm:text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide">
            Pending
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (st?: string) => {
    const s = (st || "pending").toLowerCase();
    switch (s) {
      case "paid":
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-[2px] text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
            Paid
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-[2px] text-[10px] sm:text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wide">
            Failed
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-[2px] text-[10px] sm:text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wide">
            Refunded
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-[2px] text-[10px] sm:text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide">
            Pending
          </span>
        );
    }
  };

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

  // Quick add to cart from empty cart suggestions
  const handleQuickAdd = (product: any) => {
    const existingIndex = cartItems.findIndex((it) => it._id === product._id);
    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = [...cartItems];
      updated[existingIndex].quantity += 1;
    } else {
      updated = [
        ...cartItems,
        {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          comparePrice: product.comparePrice,
          image: product.images?.[0]?.url || product.images?.[0]?.publicUrl || product.image || "",
          quantity: 1,
        },
      ];
    }
    updateCartItemsState(updated);
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      setCouponError("Add items to your cart first to apply coupons.");
      return;
    }

    // Single coupon check: If the same coupon is already applied
    if (appliedCoupon && appliedCoupon.code === code) {
      setCouponError(`Coupon "${code}" is already applied.`);
      return;
    }

    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(null);

    try {
      const res = await api("order/validate-coupon", { code, subtotal }, "POST");
      if (res && res.status && res.data) {
        // Enforce single coupon: replaces any previous coupon
        const isReplacing = !!appliedCoupon;
        setAppliedCoupon(res.data);
        if (isReplacing) {
          setCouponSuccess(`Coupon updated to "${code}"! (Only 1 coupon applied per order)`);
        } else {
          setCouponSuccess(res.message || `Coupon "${code}" applied successfully!`);
        }
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
    } catch { }

    // Sync abandoned cart at payment_pending step
    syncAbandonedCart("payment_pending");
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle Payment Screenshot Selection (Client-side preview only, NO immediate API or database call)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPaymentError("Please upload an image file (JPG, PNG, or WEBP).");
      return;
    }

    setPaymentError(null);
    setScreenshotError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      setScreenshotPreview(base64Data);
      setSelectedProof({
        base64: base64Data,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  // Place Final Order: Upload screenshot and save order to database ONLY upon clicking "Order Now"
  const handlePlaceOrder = async () => {
    if (!selectedProof && !screenshotPreview) {
      setScreenshotError("Please upload your payment screenshot to proceed with your order.");
      const el = document.getElementById("payment-screenshot-upload-box");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setSubmittingOrder(true);
    setPaymentError(null);
    setScreenshotError(null);

    try {
      // 1. Upload screenshot to storage/API only now
      let finalScreenshotUrl = "";
      if (selectedProof) {
        try {
          const uploadRes = await api("upload/payment-proof", {
            imageBase64: selectedProof.base64,
            fileName: selectedProof.fileName,
          }, "POST");

          if (uploadRes && uploadRes.status && uploadRes.data?.url) {
            finalScreenshotUrl = uploadRes.data.url;
          } else {
            finalScreenshotUrl = selectedProof.base64;
          }
        } catch {
          finalScreenshotUrl = selectedProof.base64;
        }
      } else if (screenshotPreview) {
        finalScreenshotUrl = screenshotPreview;
      }

      let customerId = undefined;
      try {
        const saved = localStorage.getItem("eclera_customer");
        if (saved) {
          const parsed = JSON.parse(saved);
          customerId = parsed._id || parsed.id;
        }
      } catch { }

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
        paymentScreenshot: finalScreenshotUrl,
        utrNumber: utrNumber.trim(),
        cartNumber,
        notes: `QR Payment proof attached. Customer UTR: ${utrNumber || "N/A"}`,
      };

      // 2. Save order to database
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
    const proofUrl =
      placedOrder.paymentScreenshot ||
      placedOrder.paymentProofUrl ||
      screenshotPreview ||
      "";

    const handleOpenPaymentProof = (e: React.MouseEvent) => {
      e.preventDefault();
      if (!proofUrl) return;

      if (proofUrl.startsWith("data:")) {
        const win = window.open("", "_blank");
        if (win) {
          win.document.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Payment Proof Screenshot - ${placedOrder.orderNumber}</title>
              <style>
                * { box-sizing: border-box; }
                body {
                  margin: 0;
                  background-color: #0b0f19;
                  color: #f1f5f9;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  min-height: 100vh;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  padding: 16px;
                }
                .bar {
                  margin-bottom: 14px;
                  text-align: center;
                }
                .bar h2 {
                  margin: 0 0 4px 0;
                  font-size: 15px;
                  font-weight: 600;
                  letter-spacing: 0.05em;
                }
                .bar p {
                  margin: 0;
                  font-size: 12px;
                  color: #94a3b8;
                }
                .frame {
                  max-width: 100%;
                  max-height: 85vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  background: #1e293b;
                  padding: 8px;
                  border-radius: 8px;
                  border: 1px solid #334155;
                  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
                }
                img {
                  max-width: 100%;
                  max-height: 82vh;
                  object-fit: contain;
                  border-radius: 4px;
                  display: block;
                }
              </style>
            </head>
            <body>
              <div class="bar">
                <h2>Payment Proof Screenshot</h2>
                <p>Order: ${placedOrder.orderNumber}</p>
              </div>
              <div class="frame">
                <img src="${proofUrl}" alt="Payment Proof Screenshot - ${placedOrder.orderNumber}" />
              </div>
            </body>
            </html>
          `);
          win.document.close();
        }
      } else {
        window.open(proofUrl, "_blank", "noopener,noreferrer");
      }
    };

    return (
      <div className="w-full bg-[#FAF7F5] min-h-screen pb-16 sm:pb-20 pt-6 sm:pt-12">
        <div className="max-w-[760px] mx-auto px-3 sm:px-6">
          <div className="bg-white border border-stone-200 shadow-sm p-4 sm:p-8 md:p-10 text-center">
            {/* Success Icon */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#5B6240]/10 text-[#5B6240] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5">
              <FiCheckCircle className="w-7 h-7 sm:w-9 sm:h-9" />
            </div>

            <span className="text-[10px] sm:text-[11px] font-semibold tracking-widest text-[#5B6240] uppercase">
              {placedOrder.orderStatus === "delivered"
                ? "Order Delivered"
                : placedOrder.orderStatus === "shipped"
                ? "Order Shipped"
                : placedOrder.orderStatus === "confirmed"
                ? "Order Confirmed"
                : "Order Request Submitted"}
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-stone-900 mt-1 mb-2 tracking-tight">
              Thank You For Your Order!
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto leading-relaxed px-1">
              {placedOrder.orderStatus === "delivered"
                ? "Your order has been successfully delivered. Thank you for choosing Eclera Botanical Skincare!"
                : placedOrder.orderStatus === "shipped"
                ? "Great news! Your package has been dispatched and is on its way to your delivery address."
                : placedOrder.orderStatus === "confirmed"
                ? "Your payment proof has been verified and your order has been confirmed by our team."
                : "We have received your order request along with your payment screenshot proof. Our admin team will verify the payment and confirm your order shortly."}
            </p>

            {/* Order Details Summary Box */}
            <div className="mt-6 sm:mt-8 p-3.5 sm:p-5 bg-[#FAF9F5] border border-stone-200 text-left text-xs sm:text-[13px] space-y-3">
              <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-1.5 pb-2.5 border-b border-stone-200">
                <span className="text-stone-500 font-medium">Order Number:</span>
                <span className="font-semibold text-stone-900 text-xs sm:text-sm tracking-wide break-all">
                  {placedOrder.orderNumber}
                </span>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-1.5">
                <span className="text-stone-500 font-medium">Order Status:</span>
                <div className="shrink-0">
                  {getOrderStatusBadge(placedOrder.orderStatus)}
                </div>
              </div>
              {placedOrder.paymentStatus && (
                <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-1.5">
                  <span className="text-stone-500 font-medium">Payment Status:</span>
                  <div className="shrink-0">
                    {getPaymentStatusBadge(placedOrder.paymentStatus)}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-1.5">
                <span className="text-stone-500 font-medium">Payment Proof:</span>
                <div className="shrink-0">
                  {proofUrl ? (
                    <a
                      href={proofUrl}
                      onClick={handleOpenPaymentProof}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View payment proof screenshot in new tab"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border border-blue-200 text-[10px] sm:text-[11px] font-semibold tracking-wider rounded-[2px] transition-all cursor-pointer group active:scale-95"
                    >
                      <span>Screenshot Uploaded</span>
                      <FiExternalLink className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] sm:text-[11px] font-semibold tracking-wider rounded-[2px]">
                      Verified
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t border-stone-200">
                <span className="text-stone-500 font-medium">Total Paid:</span>
                <span className="font-bold text-stone-900 text-sm sm:text-base">
                  ₹{Number(placedOrder.totalAmount || totalAmount).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Delivery Recipient Details */}
            <div className="mt-3.5 sm:mt-4 p-3.5 sm:p-5 bg-white border border-stone-200 text-left text-xs sm:text-[13px] space-y-1 text-stone-600">
              <p className="font-semibold text-stone-900 tracking-wider text-[11px] sm:text-xs mb-1.5 uppercase">
                Shipping To:
              </p>
              <p className="font-semibold text-stone-800 break-words">{placedOrder.customer?.name}</p>
              <p className="break-words">{placedOrder.shippingAddress?.street}</p>
              <p className="break-words">
                {placedOrder.shippingAddress?.city}, {placedOrder.shippingAddress?.state} -{" "}
                {placedOrder.shippingAddress?.postalCode}
              </p>
              <p>Phone: +91 {placedOrder.customer?.phone}</p>
            </div>

            {/* 24/7 Customer Satisfaction Support with direct WhatsApp Redirect */}
            <div className="mt-3.5 sm:mt-4 p-3 sm:p-3.5 bg-stone-50 border border-stone-200 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-[13px] text-stone-700 text-center flex-wrap leading-relaxed">
              <RiWhatsappLine className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Have any queries regarding your order? We are here 24/7:{" "}
                <a
                  href={`https://wa.me/917600152171?text=${encodeURIComponent(
                    `Hi Eclera, I have a query regarding my order #${placedOrder.orderNumber}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 font-semibold text-[#5B6240] hover:text-[#474D32] transition-colors cursor-pointer"
                >
                  Support
                </a>
              </span>
            </div>

            {/* Action Button */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/shop"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#5B6240] hover:bg-[#474D32] text-white text-xs sm:text-sm font-semibold tracking-wider transition-colors shadow-xs active:scale-[0.99]"
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
  // EMPTY CART STATE - SHORT MINIMAL UI
  // ----------------------------------------------------
  if (cartItems.length === 0) {
    return (
      <div className="w-full bg-[#FAF7F5] min-h-[75vh] flex items-center justify-center py-16 px-4">
        <div className="text-center max-w-md mx-auto">
          {/* Cart Empty Icon */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-full bg-[#5B6240]/10 border border-[#5B6240]/20 flex items-center justify-center text-[#5B6240]">
            <FiShoppingBag className="w-9 h-9 sm:w-10 sm:h-10 stroke-[1.5]" />
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-2.5 tracking-tight">
            Your Shopping Cart is Empty
          </h1>

          {/* Description */}
          <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto leading-relaxed mb-6">
            Looks like your cart is empty. Explore our products and add your favorites to get started.
          </p>

          {/* Shop Now Button */}
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#5B6240] hover:bg-[#474D32] text-white text-xs font-semibold tracking-wider transition-colors shadow-xs active:scale-95"
          >
            <span>Shop Now</span>
            <FiArrowRight className="w-4 h-4" />
          </Link>
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
            <span className="text-stone-900 font-semibold tracking-wider text-[11px]">
              {step === 1 ? "Cart" : step === 2 ? "Order" : "Payment"}
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
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold cursor-pointer transition-colors ${step >= 1 ? "bg-[#5B6240] text-white" : "bg-stone-200 text-stone-600"
                  }`}
              >
                1
              </button>
              <span className={`ml-2 text-xs font-semibold tracking-wider hidden sm:inline ${step === 1 ? "text-[#5B6240]" : "text-stone-600"
                }`}>
                Cart
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
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold cursor-pointer transition-colors ${step >= 2 ? "bg-[#5B6240] text-white" : "bg-stone-200 text-stone-600"
                  }`}
              >
                2
              </button>
              <span className={`ml-2 text-xs font-semibold tracking-wider hidden sm:inline ${step === 2 ? "text-[#5B6240]" : "text-stone-600"
                }`}>
                Order
              </span>
            </div>

            <div className={`w-12 sm:w-20 h-0.5 mx-2 sm:mx-3 ${step >= 3 ? "bg-[#5B6240]" : "bg-stone-200"}`} />

            {/* Step 3 */}
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${step >= 3 ? "bg-[#5B6240] text-white" : "bg-stone-200 text-stone-600"
                  }`}
              >
                3
              </div>
              <span className={`ml-2 text-xs font-semibold tracking-wider hidden sm:inline ${step === 3 ? "text-[#5B6240]" : "text-stone-600"
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
                  <h2 className="text-sm sm:text-base font-semibold text-stone-900 tracking-wider">
                    Cart ({cartItems.reduce((acc, it) => acc + it.quantity, 0)})
                  </h2>
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
                          title={item.name}
                          className="text-xs sm:text-sm font-semibold text-stone-900 hover:text-[#5B6240] transition-colors line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs sm:text-sm font-semibold text-stone-900">
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
                            <span className="w-8 text-center text-xs font-semibold text-stone-900">
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
                        <span className="text-xs sm:text-sm font-semibold text-stone-900">
                          ₹{(Number(item.price) * Number(item.quantity)).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Action */}
                <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-stone-600">
                    Subtotal: <strong className="text-sm sm:text-base font-semibold text-stone-900">₹{subtotal.toLocaleString("en-IN")}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      syncAbandonedCart("contact_info");
                      setStep(2);
                    }}
                    className="px-6 py-3 bg-[#5B6240] hover:bg-[#474D32] text-white text-xs font-semibold tracking-wider flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                  >
                    <span>Place Order</span>
                    <FiArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: ORDER INFORMATION & SHIPPING FORM */}
            {step === 2 && (
              <form onSubmit={handleProceedToPayment} className="bg-white border border-stone-200 shadow-2xs p-5 sm:p-7 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <h2 className="text-sm sm:text-base font-semibold text-stone-900 tracking-wider">
                    Order Information
                  </h2>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-[#5B6240] hover:underline flex items-center gap-1"
                  >
                    <FiArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Cart</span>
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
                    <label className="text-xs font-semibold text-stone-700 tracking-wide">
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
                    <label className="text-xs font-semibold text-stone-700 tracking-wide">
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
                  <label className="text-xs font-semibold text-stone-700 tracking-wide">
                    Email Address <span className="text-stone-400 font-normal text-[11px]">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email id (Optional)"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full h-11 px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-stone-300 focus:border-[#5B6240] focus:ring-1 focus:ring-[#5B6240] focus:outline-none transition-colors text-stone-900"
                  />
                </div>

                {/* Country and State Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700 tracking-wide">
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
                    <label className="text-xs font-semibold text-stone-700 tracking-wide">
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
                  <label className="text-xs font-semibold text-stone-700 tracking-wide">
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
                    <label className="text-xs font-semibold text-stone-700 tracking-wide">
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
                    <label className="text-xs font-semibold text-stone-700 tracking-wide">
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
                    className="px-5 py-2.5 border border-stone-300 text-stone-700 text-xs font-semibold tracking-wider hover:bg-stone-50 cursor-pointer"
                  >
                    Back to Cart
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#5B6240] hover:bg-[#474D32] text-white text-xs font-semibold tracking-wider flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                  >
                    <span>Continue to Payment</span>
                    <FiArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: QR CODE PAYMENT & SCREENSHOT PROOF UPLOAD */}
            {step === 3 && (
              <>
                <div className="bg-white border border-stone-200 shadow-2xs p-5 sm:p-7 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <div>
                    <span className="text-[10px] font-semibold tracking-widest text-[#5B6240]">
                      Final Step
                    </span>
                    <h2 className="text-sm sm:text-base font-semibold text-stone-900 tracking-wider">
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
                    <span className="text-[10px] font-semibold text-stone-500 tracking-wider mt-2">
                      Scan to Pay
                    </span>
                  </div>

                  {/* Payment Details */}
                  <div className="flex-1 space-y-3 text-center sm:text-left">
                    <div>
                      <span className="text-[11px] text-stone-500 font-medium">Total Payable Amount</span>
                      <p className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
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
                        <span className="font-semibold text-stone-900">8866002766@kotakbank</span>
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
                    <label className="text-xs font-semibold text-stone-900 tracking-wider">
                      Upload Payment Screenshot <span className="text-red-500">*</span>
                    </label>
                  </div>

                  {!screenshotPreview ? (
                    <div>
                      <label
                        id="payment-screenshot-upload-box"
                        className={`border-2 border-dashed p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer transition-colors group ${
                          screenshotError
                            ? "border-red-500 bg-red-50/40 ring-1 ring-red-500"
                            : "border-stone-300 hover:border-[#5B6240] bg-stone-50/50 hover:bg-[#FAF9F5]"
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <div
                          className={`w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xs mb-3 transition-colors ${
                            screenshotError ? "text-red-500" : "text-stone-400 group-hover:text-[#5B6240]"
                          }`}
                        >
                          <FiUploadCloud className="w-6 h-6" />
                        </div>
                        <span
                          className={`text-xs font-semibold tracking-wider ${
                            screenshotError ? "text-red-700" : "text-stone-800"
                          }`}
                        >
                          Click to upload payment screenshot
                        </span>
                        <span className="text-[11px] text-stone-400 mt-1">
                          PNG, JPG, or WEBP (Max 10MB)
                        </span>
                      </label>

                      {/* Error message without icon */}
                      {screenshotError && (
                        <div className="mt-2.5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-none leading-relaxed">
                          <span>{screenshotError}</span>
                        </div>
                      )}
                    </div>
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
                          <span className="text-xs font-semibold text-stone-900">
                            Screenshot Proof Attached
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500">
                          Screenshot attached and ready to submit with order.
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
                              setSelectedProof(null);
                              setScreenshotError(null);
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
                    <label className="text-xs font-semibold text-stone-700 tracking-wide">
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
                    disabled={submittingOrder}
                    className="w-full sm:w-auto px-8 py-3.5 bg-[#5B6240] hover:bg-[#474D32] disabled:bg-stone-300 text-white text-xs font-semibold tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors"
                  >
                    {submittingOrder ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Placing Order...</span>
                      </>
                    ) : (
                      <>
                        <FiCheck className="w-4 h-4" />
                        <span>Order Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Standalone Separate Security & Trust Block with 24/7 WhatsApp Support (Placed at the very end/last) */}
              <div className="mt-6 bg-white border border-stone-200 p-5 space-y-4 shadow-2xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-2.5 bg-[#FAF9F5] border border-stone-200 flex items-center gap-2">
                    <FiShield className="w-4 h-4 text-[#5B6240] shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold text-stone-900">100% Secure Payment</p>
                      <p className="text-[10px] text-stone-500">Verified UPI transaction</p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#FAF9F5] border border-stone-200 flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold text-stone-900">Verified Merchant</p>
                      <p className="text-[10px] text-stone-500">Khokhani Prit Ghanshyambhai</p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#FAF9F5] border border-stone-200 flex items-center gap-2">
                    <FiLock className="w-4 h-4 text-[#5B6240] shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold text-stone-900">SSL Protected</p>
                      <p className="text-[10px] text-stone-500">End-to-end encrypted</p>
                    </div>
                  </div>
                </div>

                {/* 24/7 Customer Satisfaction Support with direct WhatsApp Redirect */}
                <div className="p-3 bg-stone-50 border border-stone-200 flex items-center justify-center gap-2 text-xs text-stone-700 text-center">
                  <RiWhatsappLine className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Have any queries regarding your order? We are here 24/7:{" "}
                    <a
                      href="https://wa.me/917600152171?text=Hi%20Eclera%2C%20I%20have%20a%20query%20regarding%20my%20order."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold text-[#5B6240] hover:text-[#474D32] transition-colors cursor-pointer"
                    >
                      Support
                    </a>
                  </span>
                </div>
              </div>
            </>
          )}
          </div>

          {/* ============================================================
              RIGHT COLUMN: Order Summary & Coupon Card
             ============================================================ */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Coupon Section */}
            <div className="bg-white border border-stone-200 shadow-2xs p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm sm:text-base font-semibold text-stone-900 tracking-wider flex items-center gap-2">
                  <FiTag className="w-4 h-4 text-[#5B6240]" />
                  <span>Coupons & Offers</span>
                </span>
              </div>

              {/* If Coupon is already applied */}
              {appliedCoupon ? (
                <div className="space-y-2">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs">
                        <FiCheck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-emerald-900">
                          {appliedCoupon.code} Applied
                        </p>
                        <p className="text-[11px] text-emerald-700">
                          You saved ₹{appliedCoupon.discountAmount}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs font-semibold text-red-600 hover:underline cursor-pointer tracking-wider"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                    <span>• Only 1 coupon applied per order</span>
                    <button
                      type="button"
                      onClick={handleOpenCouponModal}
                      className="text-[#5B6240] hover:underline font-semibold"
                    >
                      Change Coupon
                    </button>
                  </div>
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
                        setCouponInput(e.target.value.toUpperCase());
                        setCouponError(null);
                        setCouponSuccess(null);
                      }}
                      className="flex-1 px-3 py-2 text-xs font-medium tracking-wider border border-stone-300 focus:border-[#5B6240] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCouponCode(couponInput)}
                      disabled={couponLoading}
                      className="px-5 py-2 bg-[#5B6240] hover:bg-[#474D32] disabled:bg-stone-300 text-white text-xs font-semibold tracking-wider cursor-pointer transition-colors"
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
                    <span className="text-stone-500">Only 1 coupon applicable per order</span>
                    <button
                      type="button"
                      onClick={handleOpenCouponModal}
                      className="text-[#5B6240] hover:text-[#474D32] font-semibold tracking-wider text-[11px] hover:underline cursor-pointer"
                    >
                      View All Coupons
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Order Summary Card */}
            <div className="bg-white border border-stone-200 shadow-2xs p-5 sm:p-6 space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-stone-900 tracking-wider pb-3 border-b border-stone-200">
                Order Summary
              </h3>

              <div className="space-y-3 text-xs sm:text-sm text-stone-600">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-stone-600">Cart Subtotal ({cartItems.reduce((acc, it) => acc + it.quantity, 0)} items)</span>
                  <span className="font-semibold text-stone-900 text-sm sm:text-base">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>Shipping & Delivery</span>
                  <span className="text-emerald-700 font-semibold text-xs">Free Delivery</span>
                </div>

                <div className="pt-3.5 border-t border-stone-200 flex justify-between items-baseline">
                  <span className="text-sm sm:text-base font-semibold text-stone-900 tracking-wide">
                    Total Amount
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-stone-900">
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Step Navigation / Information */}
              <div className="pt-3 text-[11px] text-stone-500 flex items-center gap-1.5 border-t border-stone-100">
                <FiClock className="w-3.5 h-3.5 text-[#5B6240]" />
                <span>Orders confirmed within 15 minutes of payment verification.</span>
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
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-stone-900 tracking-wider">
                    Available Coupons ({availableCoupons.length})
                  </h3>
                  <p className="text-[11px] text-stone-500">Only 1 coupon can be applied per order</p>
                </div>
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
                      className={`border p-4 transition-all relative ${isCurrentlyApplied
                          ? "border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500"
                          : isEligible
                            ? "border-stone-200 bg-white hover:border-[#5B6240]"
                            : "border-stone-200 bg-stone-50/60 opacity-80"
                        }`}
                    >
                      {/* Top Row: Code Badge + Action Button */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 font-semibold text-xs bg-stone-100 text-stone-900 border border-dashed border-stone-400 uppercase tracking-wider">
                            {c.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(c.code)}
                            title="Copy code"
                            className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer text-xs"
                          >
                            {copiedCode === c.code ? (
                              <span className="text-[10px] text-emerald-600 font-semibold">COPIED</span>
                            ) : (
                              <FiCopy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Apply / Applied Button */}
                        {isCurrentlyApplied ? (
                          <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                            <FiCheck className="w-3.5 h-3.5" />
                            Applied
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={!isEligible}
                            onClick={() => handleApplyCouponCode(c.code)}
                            className={`px-4 py-1.5 text-xs font-semibold tracking-wider transition-colors cursor-pointer ${isEligible
                                ? "bg-[#5B6240] hover:bg-[#474D32] text-white shadow-xs"
                                : "bg-stone-200 text-stone-400 cursor-not-allowed"
                              }`}
                          >
                            Apply
                          </button>
                        )}
                      </div>

                      {/* Coupon Discount Details formatted as <ul> <li> list with bullets */}
                      <ul className="mt-2.5 list-disc pl-4 space-y-1 text-xs text-stone-600">
                        <li className="font-semibold text-stone-900">
                          {c.savingsDescription ||
                            (c.type === "percentage"
                              ? `Get ${c.value}% OFF${c.maxDiscountAmount && c.maxDiscountAmount > 0
                                ? ` up to ₹${c.maxDiscountAmount}`
                                : ""
                              }`
                              : `Flat ₹${c.value} OFF`)}
                        </li>

                        {c.description ? (
                          <li className="text-stone-600 leading-snug">
                            {c.description}
                          </li>
                        ) : null}

                        {minRequired > 0 && (
                          <li className="text-stone-600">
                            Minimum cart value: <strong className="text-stone-800">₹{minRequired.toLocaleString("en-IN")}</strong>
                          </li>
                        )}

                        {c.type === "percentage" && c.maxDiscountAmount && c.maxDiscountAmount > 0 && !c.savingsDescription?.includes("Up to") && (
                          <li className="text-stone-600">
                            Maximum discount: <strong className="text-stone-800">₹{c.maxDiscountAmount.toLocaleString("en-IN")}</strong>
                          </li>
                        )}

                        {!isEligible && (
                          <li className="text-amber-700 font-medium">
                            Add ₹{diff.toLocaleString("en-IN")} more to unlock this coupon (Current: ₹{subtotal.toLocaleString("en-IN")})
                          </li>
                        )}

                        {isEligible && !isCurrentlyApplied && (
                          <li className="text-emerald-700 font-medium">
                            Your cart is eligible for this coupon!
                          </li>
                        )}
                      </ul>
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
                className="px-4 py-1.5 border border-stone-300 text-stone-700 font-semibold text-[11px] hover:bg-stone-100 cursor-pointer"
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
