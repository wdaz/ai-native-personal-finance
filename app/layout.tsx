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

export const metadata: Metadata = {
  title: "Personal Finance",
  description: "Frontend Mentor Personal Finance App — AI-native SDLC portfolio project",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={publicSans.variable}>
      <body>{children}</body>
    </html>
  );
}
