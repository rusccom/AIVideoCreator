import Stripe from "stripe";

let stripe: Stripe | undefined;

export function getStripe() {
  if (!stripe) {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      throw new Error("STRIPE_SECRET_KEY is required");
    }
    stripe = new Stripe(secret);
  }
  return stripe;
}
