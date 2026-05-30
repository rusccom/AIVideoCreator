import type Stripe from "stripe";
import { getBillingConfig } from "./billing-config-service";
import {
  attachCheckoutSession,
  createPendingPayment,
  deletePendingPayment
} from "./billing-payment-service";
import { getActiveTopUpPackage } from "./top-up-package-service";
import { getStripe } from "./stripe-client";

type CheckoutUser = {
  id: string;
  email: string;
  name?: string | null;
};

export async function createTopUpCheckoutSession(
  user: CheckoutUser,
  packageKey: string
) {
  const item = await getActiveTopUpPackage(packageKey);
  if (!item) throw new Error("Unknown top-up package");
  const config = await getBillingConfig();
  const payment = await createPendingPayment(user.id, item, config.creditsPerUsd);
  try {
    const session = await getStripe().checkout.sessions.create(
      checkoutParams(user, payment),
      { idempotencyKey: `checkout:${payment.id}` }
    );
    await attachCheckoutSession(payment.id, session.id);
    return session;
  } catch (err) {
    await deletePendingPayment(payment.id);
    throw err;
  }
}

function checkoutParams(
  user: CheckoutUser,
  payment: CheckoutPayment
): Stripe.Checkout.SessionCreateParams {
  const metadata = checkoutMetadata(payment);
  return {
    mode: "payment" as const,
    customer_email: user.email,
    success_url: `${appUrl()}/app/billing?checkout=success`,
    cancel_url: `${appUrl()}/app/billing?checkout=cancel`,
    line_items: [lineItem(payment)],
    metadata,
    payment_intent_data: { metadata }
  };
}

type CheckoutPayment = Awaited<ReturnType<typeof createPendingPayment>>;

function checkoutMetadata(payment: CheckoutPayment) {
  return {
    paymentId: payment.id,
    userId: payment.userId,
    packageKey: payment.packageKey,
    credits: String(payment.credits)
  };
}

function lineItem(payment: CheckoutPayment) {
  return {
    price_data: {
      currency: payment.currency,
      unit_amount: payment.amountCents,
      product_data: productData(payment)
    },
    quantity: 1
  };
}

function productData(payment: CheckoutPayment) {
  return {
    name: `${formatAmount(payment.amountCents)} credit top-up`,
    description: `${payment.credits.toLocaleString()} credits`
  };
}

function formatAmount(amountCents: number) {
  return `$${(amountCents / 100).toFixed(0)}`;
}

function appUrl() {
  const url = process.env.APP_URL;
  if (!url) throw new Error("APP_URL is required for checkout success/cancel URLs");
  return url;
}
