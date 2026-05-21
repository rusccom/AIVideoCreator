import type { Metadata } from "next";
import "@/styles/marketing.css";
import "@/styles/marketing-sections.css";
import "@/styles/marketing-responsive.css";
import { MarketingNav } from "@/application/marketing/client";

const siteName = "AI Video Director";
const title = "AI Video Director - Long AI Videos From One Idea";
const description =
  "Create long AI videos from one idea for ads, product stories, AI news episodes and social content without visible transitions.";

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
