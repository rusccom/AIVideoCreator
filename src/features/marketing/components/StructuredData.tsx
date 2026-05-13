import { faqs } from "../data/marketing-content";
import { marketingPlans } from "../data/pricing-plans";

const baseUrl = "https://aivideocreator.app";
const siteName = "AI Sequential Video Studio";

const organization = {
  "@type": "Organization",
  "@id": `${baseUrl}/#organization`,
  name: siteName,
  url: baseUrl,
  logo: `${baseUrl}/opengraph-image`,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "contact@aivideocreator.app"
  }
};

const website = {
  "@type": "WebSite",
  "@id": `${baseUrl}/#website`,
  url: baseUrl,
  name: siteName,
  publisher: { "@id": `${baseUrl}/#organization` },
  inLanguage: "en-US"
};

const softwareApplication = {
  "@type": "SoftwareApplication",
  "@id": `${baseUrl}/#app`,
  name: siteName,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  description:
    "Generate long AI video scenes from linked 10-second clips that continue from the previous end frame.",
  offers: marketingPlans.map((plan) => ({
    "@type": "Offer",
    name: plan.name,
    price: plan.price.replace(/[^0-9]/g, "") || "0",
    priceCurrency: "USD",
    description: plan.credits
  }))
};

const faqPage = {
  "@type": "FAQPage",
  "@id": `${baseUrl}/#faq`,
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer
    }
  }))
};

const graph = {
  "@context": "https://schema.org",
  "@graph": [organization, website, softwareApplication, faqPage]
};

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
