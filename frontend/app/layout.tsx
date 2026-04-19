import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UNOCHA WMI Rankings",
  description: "Interactive 2025 humanitarian WMI rankings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
