import React, { Suspense } from "react";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import ReviewNotificationToast from "@/components/ReviewNotificationToast";
import { PromoPopup } from "@/components/PromoPopup";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eclera Cosmetics | Clean Beauty & Luxury Skincare",
  description:
    "Discover dermatologically tested, clean, cruelty-free cosmetics and skincare formulations designed for radiant Indian skin.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className={`${poppins.className} min-h-full flex flex-col bg-[#FAF7F5] text-stone-900`}>
        <Suspense fallback={<div className="h-20 bg-white" />}>
          <Header />
        </Suspense>
        <main className="flex-1 min-h-[50vh]">{children}</main>
        <Footer />
        <ReviewNotificationToast />
        <PromoPopup />
      </body>
    </html>
  );
}
