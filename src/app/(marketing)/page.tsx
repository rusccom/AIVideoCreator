import type { Metadata } from "next";
import { AudienceSection } from "@/application/marketing/client";
import { BenefitsSection } from "@/application/marketing/client";
import { FaqSection } from "@/application/marketing/client";
import { HeroSection } from "@/application/marketing/client";
import { MarketingFooter } from "@/application/marketing/client";
import { PricingSection } from "@/application/marketing/client";
import { ProcessSection } from "@/application/marketing/client";
import { StructuredData } from "@/application/marketing/client";
import { UseCasesSection } from "@/application/marketing/client";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  keywords: [
    "AI video generator",
    "sequential video",
    "AI storyboard",
    "image to video",
    "long AI scenes",
    "AI video studio",
    "Kling",
    "Runway",
    "frame continuation"
  ],
  openGraph: { url: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1
    }
  }
};

export default function HomePage() {
  return (
    <main>
      <StructuredData />
      <HeroSection />
      <ProcessSection />
      <BenefitsSection />
      <AudienceSection />
      <UseCasesSection />
      <PricingSection />
      <FaqSection />
      <MarketingFooter />
    </main>
  );
}
