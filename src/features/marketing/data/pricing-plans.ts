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
    key: "topup-10",
    name: "Credit pack",
    price: "$10",
    credits: "Credits by current account rate",
    features: ["Stripe checkout", "Instant balance update", "Payment history"]
  },
  {
    key: "topup-20",
    name: "Creator pack",
    price: "$20",
    credits: "Credits by current account rate",
    featured: true,
    features: ["Stripe checkout", "Instant balance update", "Payment history"]
  },
  {
    key: "topup-50",
    name: "Studio pack",
    price: "$50",
    credits: "Credits by current account rate",
    features: ["Stripe checkout", "Instant balance update", "Payment history"]
  }
];
