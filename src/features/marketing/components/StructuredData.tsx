import { faqs } from "../data/marketing-content";
import { marketingPlans } from "../data/pricing-plans";
import { brand } from "@/shared/brand";

const baseUrl = brand.url;
const siteName = brand.name;

const organization = {
  "@type": "Organization",
  "@id": `${baseUrl}/#organization`,
  name: siteName,
  url: baseUrl,
  logo: `${baseUrl}/opengraph-image`,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: brand.email
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
  description: brand.description,
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
    name: faq.title,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.text
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
