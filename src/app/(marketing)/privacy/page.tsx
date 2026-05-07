import type { Metadata } from "next";
import { LegalPage } from "@/features/marketing/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy",
  robots: { index: false, follow: false }
};

const sections = [
  {
    heading: "Private assets",
    text: "Uploaded and generated media are stored as private project assets with signed access URLs."
  },
  {
    heading: "Generation records",
    text: "Prompts, jobs, statuses, credits, and model metadata are stored for reliability and support."
  },
  {
    heading: "Billing",
    text: "Subscription and payment events are handled through Stripe Billing and webhook verification."
  }
];

export default function PrivacyPage() {
  return <LegalPage title="Privacy policy" sections={sections} />;
}
