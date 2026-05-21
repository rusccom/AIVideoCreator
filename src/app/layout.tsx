import type { Metadata, Viewport } from "next";
import "@/styles/base.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://aivideocreator.app"),
  title: {
    default: "AI Video Director",
    template: "%s | AI Video Director"
  },
  description: "Create long AI videos from one idea with connected scenes and no visible transitions.",
  applicationName: "AI Video Director",
  authors: [{ name: "AI Video Director" }],
  creator: "AI Video Director",
  publisher: "AI Video Director",
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
