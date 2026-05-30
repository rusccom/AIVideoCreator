import type { Metadata, Viewport } from "next";
import "@/styles/base.css";
import { brand } from "@/shared/brand";

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: {
    default: brand.name,
    template: `%s | ${brand.name}`
  },
  description: brand.description,
  applicationName: brand.name,
  authors: [{ name: brand.name }],
  creator: brand.name,
  publisher: brand.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  robots: {
    index: false,
    follow: false
  }
};

export const viewport: Viewport = {
  themeColor: "#070d12",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
