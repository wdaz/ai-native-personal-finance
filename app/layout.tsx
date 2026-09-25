import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/src/ui/tokens.css";
import "./globals.css";

// TD-11: Public Sans comes from committed files, so no build downloads from Google Fonts —
// `next/font/google` does that at build time, and a network hiccup then fails the build.
// Weights 400 and 700, latin subset; source, version and licence: app/fonts/README.md.
const publicSans = localFont({
  src: [
    { path: "./fonts/public-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/public-sans-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
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
