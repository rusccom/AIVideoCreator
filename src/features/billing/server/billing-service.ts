import Stripe from "stripe";
import { prisma } from "@/shared/server/prisma";
import { getStripe } from "./stripe-client";

type BillingUser = {
  id: string;
  email: string;
  name?: string | null;
};

export async function createCheckoutSession(user: BillingUser, priceId: string) {
  const customerId = await ensureCustomer(user);
  return getStripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    success_url: `${appUrl()}/app/billing?checkout=success`,
    cancel_url: `${appUrl()}/app/billing?checkout=cancel`,
    line_items: [{ price: priceId, quantity: 1 }]
  });
}

export async function createPortalSession(userId: string) {
  const subscription = await latestSubscription(userId);
  if (!subscription?.stripeCustomerId) {
    throw new Error("Stripe customer not found");
  }
  return getStripe().billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${appUrl()}/app/billing`
  });
}

export async function handleStripeEvent(event: Stripe.Event) {
  const created = await createWebhookEvent(event);
  if (!created) {
    return { duplicate: true };
  }
  if (event.type.startsWith("customer.subscription.")) {
    return upsertSubscription(event.data.object as Stripe.Subscription);
  }
  if (event.type === "invoice.paid") {
    return grantInvoiceCredits(event.data.object as Stripe.Invoice, event.id);
  }
  return { ignored: true };
}

async function ensureCustomer(user: BillingUser) {
  const subscription = await latestSubscription(user.id);
  if (subscription?.stripeCustomerId) {
    return subscription.stripeCustomerId;
  }
  const customer = await getStripe().customers.create({ email: user.email, name: user.name ?? undefined });
  await prisma.subscription.create({
    data: { userId: user.id, stripeCustomerId: customer.id, planKey: "starter", status: "incomplete" }
  });
  return customer.id;
}

async function latestSubscription(userId: string) {
  return prisma.subscription.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
}

async function createWebhookEvent(event: Stripe.Event) {
  const existing = await prisma.webhookEvent.findUnique({
    where: { provider_eventId: { provider: "stripe", eventId: event.id } }
  });
  if (existing) return false;
  await prisma.webhookEvent.create({ data: { provider: "stripe", eventId: event.id, payloadJson: event as object } });
  return true;
}

async function upsertSubscription(subscription: Stripe.Subscription) {
  const customerId = customerString(subscription.customer);
  const userSubscription = await prisma.subscription.findFirst({ where: { stripeCustomerId: customerId } });
  if (!userSubscription) return { ignored: true };
  return prisma.subscription.update({
    where: { id: userSubscription.id },
    data: subscriptionData(subscription)
  });
}

async function grantInvoiceCredits(invoice: Stripe.Invoice, eventId: string) {
  const customerId = customerString(invoice.customer);
  const subscription = await prisma.subscription.findFirst({ where: { stripeCustomerId: customerId } });
  if (!subscription) return { ignored: true };
  return prisma.creditLedger.create({
    data: { userId: subscription.userId, amount: subscription.monthlyCreditLimit, type: "grant", reason: "monthly subscription grant", stripeEventId: eventId }
  });
}

function subscriptionData(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  return {
    stripeSubscriptionId: subscription.id,
    stripePriceId: item?.price.id,
    status: subscription.status,
    currentPeriodStart: dateFromUnix(subscription.current_period_start),
    currentPeriodEnd: dateFromUnix(subscription.current_period_end),
    cancelAtPeriodEnd: subscription.cancel_at_period_end
  };
}

function customerString(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  return typeof customer === "string" ? customer : customer?.id ?? "";
}

function dateFromUnix(value?: number | null) {
  return value ? new Date(value * 1000) : null;
}

function appUrl() {
  return process.env.APP_URL ?? "http://localhost:3000";
}
