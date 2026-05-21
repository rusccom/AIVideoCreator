import type { Metadata } from "next";
import { AudienceSection } from "@/application/marketing/client";
import { BenefitsSection } from "@/application/marketing/client";
import { ComparisonSection } from "@/application/marketing/client";
import { ConnectedVideosSection } from "@/application/marketing/client";
import { DirectorSection } from "@/application/marketing/client";
import { FaqSection } from "@/application/marketing/client";
import { FinalCtaSection } from "@/application/marketing/client";
import { HeroSection } from "@/application/marketing/client";
import { MarketingFooter } from "@/application/marketing/client";
import { MidCtaSection } from "@/application/marketing/client";
import { PricingSection } from "@/application/marketing/client";
import { ProblemSection } from "@/application/marketing/client";
import { ProjectSection } from "@/application/marketing/client";
import { ProcessSection } from "@/application/marketing/client";
import { StructuredData } from "@/application/marketing/client";
import { UseCasesSection } from "@/application/marketing/client";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  keywords: [
    "AI Video Director",
    "long AI video generator",
    "AI product video",
    "AI news video",
    "AI video ads",
    "image to video",
    "AI storyboard",
    "connected AI scenes",
    "AI video without transitions"
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
      <BenefitsSection />
      <ProblemSection />
      <ProcessSection />
      <DirectorSection />
      <UseCasesSection />
      <MidCtaSection />
      <ConnectedVideosSection />
      <AudienceSection />
      <ProjectSection />
      <ComparisonSection />
      <PricingSection />
      <FaqSection />
      <FinalCtaSection />
      <MarketingFooter />
    </main>
  );
}
