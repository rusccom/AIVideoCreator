import type { Metadata } from "next";
import "@/styles/marketing.css";
import "@/styles/marketing-sections.css";
import "@/styles/marketing-responsive.css";
import { MarketingNav } from "@/application/marketing/client";

const siteName = "AI Sequential Video Studio";
const title = "AI Video Studio for Sequential Storyboards";
const description =
  "Generate source images, create linked AI video clips, continue scenes from end frames, and export connected MP4 timelines.";

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
