export type MarketingPlan = {
  key: string;
  name: string;
  price: string;
  credits: string;
  featured?: boolean;
  features: string[];
};

export const marketingPlans: MarketingPlan[] = [
  {
    key: "starter",
    name: "Starter",
    price: "$10",
    credits: "For testing ideas and creating simple short projects.",
    features: ["Prompt-to-plan workflow", "Short video projects", "Basic exports"]
  },
  {
    key: "creator",
    name: "Creator",
    price: "$20",
    credits: "For regular content, product ads and social videos.",
    featured: true,
    features: ["More scenes per project", "Product and social videos", "Project history"]
  },
  {
    key: "studio",
    name: "Studio",
    price: "$50",
    credits: "For longer videos, premium models and serious production.",
    features: ["Longer connected timelines", "Premium model access", "Campaign batches"]
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "Custom",
    credits: "For teams, custom workflows and dedicated limits.",
    features: ["Team workflows", "Dedicated limits", "Custom production setup"]
  }
];
