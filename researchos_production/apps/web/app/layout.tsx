"use client";
import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: "#0a0d14", color: "#f1f5f9", margin: 0 }}>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
