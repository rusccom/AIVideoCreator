export type Plan = {
  key: string;
  name: string;
  price: string;
  credits: string;
  featured?: boolean;
  features: string[];
};

export const plans: Plan[] = [
  {
    key: "starter",
    name: "Starter",
    price: "$19",
    credits: "100 credits/month",
    features: ["3 active projects", "Standard models", "720p export", "Watermark exports"]
  },
  {
    key: "creator",
    name: "Creator",
    price: "$59",
    credits: "500 credits/month",
    featured: true,
    features: ["20 active projects", "Fast and balanced models", "1080p export", "No watermark"]
  },
  {
    key: "studio",
    name: "Studio",
    price: "$199",
    credits: "2,000 credits/month",
    features: ["Unlimited projects", "Premium models", "Priority queue", "Team storage"]
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "Custom",
    credits: "Custom credits",
    features: ["Custom limits", "Model policies", "SLA", "Dedicated support"]
  }
];
