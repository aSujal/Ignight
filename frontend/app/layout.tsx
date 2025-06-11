import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Ensure font loads properly
});

export const metadata: Metadata = {
  title: "Word Impostor Game", // More specific title
  description: "A social deduction game of words and wits.", // More engaging description
  // Consider adding icons/favicons here later
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-background text-foreground">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
