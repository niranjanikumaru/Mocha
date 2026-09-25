import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppDock from "@/components/AppDock";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MochaTrade — Perpetual Trading & Mocha Market Night",
  description: "MochaTrade: Zero-Capital Perpetual Trading Venue with Explainable Margin Health & Friday Mocha Market Night Crew Pass Experience.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="mocha-page-content">{children}</div>
        <AppDock />
      </body>
    </html>
  );
}
