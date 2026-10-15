import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: { default: "iFintech — Keuangan lebih teratur", template: "%s | iFintech" },
  description: "Kelola keuangan pribadi dengan mudah dan aman.",
  manifest: "/manifest.webmanifest",
  applicationName: "iFintech",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
