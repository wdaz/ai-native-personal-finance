import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "@/src/ui/tokens.css";
import "./globals.css";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-public-sans",
  display: "swap",
});

// SPEC-app-shell §2.5 (v1.2): every page's title is "Personal Finance - <page name>" (WCAG
// 2.4.2); each page sets its own name, a page without one falls back to "Personal Finance".
export const metadata: Metadata = {
  title: { default: "Personal Finance", template: "Personal Finance - %s" },
  description: "Frontend Mentor Personal Finance App — AI-native SDLC portfolio project",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={publicSans.variable}>
      <body>{children}</body>
    </html>
  );
}
