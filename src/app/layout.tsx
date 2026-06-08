import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/ui/sidebar";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EnRoute Destek Merkezi",
  description: "Ticket analizi, kök neden tespiti ve çözüm önerisi.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={inter.variable}>
      <body suppressHydrationWarning>
        <div className="min-h-dvh flex">
          <Sidebar />
          <main className="flex-1 min-w-0 px-6 py-5">{children}</main>
        </div>
      </body>
    </html>
  );
}
