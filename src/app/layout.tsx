import type { Metadata, Viewport } from "next";
import "@/styles/base.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://aivideocreator.app"),
  title: {
    default: "AI Sequential Video Studio",
    template: "%s | AI Sequential Video Studio"
  },
  description: "Create long AI video scenes from linked 10-second clips.",
  applicationName: "AI Sequential Video Studio",
  authors: [{ name: "AI Sequential Video Studio" }],
  creator: "AI Sequential Video Studio",
  publisher: "AI Sequential Video Studio",
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
