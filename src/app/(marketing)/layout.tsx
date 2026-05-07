import type { Metadata } from "next";
import "@/styles/marketing.css";
import { MarketingNav } from "@/features/marketing/components/MarketingNav";

const siteName = "AI Sequential Video Studio";
const title = "AI Video Studio for Sequential Storyboards";
const description =
  "Generate long AI scenes from short clips that continue from the previous end frame. Build connected storyboards instead of isolated AI video attempts.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    type: "website",
    siteName,
    title,
    description,
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image",
    title,
    description
  },
  robots: {
    index: false,
    follow: false
  }
};

type MarketingLayoutProps = {
  children: React.ReactNode;
};

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="marketing-shell">
      <MarketingNav />
      {children}
    </div>
  );
}
