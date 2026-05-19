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
    key: "usd_10",
    name: "Credit pack",
    price: "$10",
    credits: "1,000 credits at default rate",
    features: ["Stripe checkout", "Starter generation balance", "Payment history"]
  },
  {
    key: "usd_20",
    name: "Creator pack",
    price: "$20",
    credits: "2,000 credits at default rate",
    featured: true,
    features: ["Stripe checkout", "More room for video scenes", "Payment history"]
  },
  {
    key: "usd_50",
    name: "Studio pack",
    price: "$50",
    credits: "5,000 credits at default rate",
    features: ["Stripe checkout", "Larger campaign batches", "Payment history"]
  }
];
