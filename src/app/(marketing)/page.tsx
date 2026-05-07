import type { Metadata } from "next";
import { AudienceSection } from "@/features/marketing/components/AudienceSection";
import { BenefitsSection } from "@/features/marketing/components/BenefitsSection";
import { FaqSection } from "@/features/marketing/components/FaqSection";
import { HeroSection } from "@/features/marketing/components/HeroSection";
import { MarketingFooter } from "@/features/marketing/components/MarketingFooter";
import { PricingSection } from "@/features/marketing/components/PricingSection";
import { ProcessSection } from "@/features/marketing/components/ProcessSection";
import { StructuredData } from "@/features/marketing/components/StructuredData";
import { UseCasesSection } from "@/features/marketing/components/UseCasesSection";

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
