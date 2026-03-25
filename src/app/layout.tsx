import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CashWise — AI Financial Copilot",
  description:
    "CashWise solves the trust gap in AI finance by turning unclear financial advice into explainable, real-time guidance students can actually rely on.",
  keywords: ["finance", "AI", "budgeting", "students", "Nigeria", "explainable AI"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
