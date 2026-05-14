import type { Metadata } from "next";
import { LegalPage } from "@/application/marketing/client";

export const metadata: Metadata = {
  title: "Terms",
  robots: { index: false, follow: false }
};

const sections = [
  {
    heading: "Creative use",
    text: "Users are responsible for prompts, uploaded references, rights, and commercial usage checks."
  },
  {
    heading: "Credits",
    text: "Generation, export, and premium model usage can consume credits based on model cost."
  },
  {
    heading: "Safety",
    text: "The service can block unsafe prompts, risky accounts, or content that violates policy."
  }
];

export default function TermsPage() {
  return <LegalPage title="Terms of service" sections={sections} />;
}
