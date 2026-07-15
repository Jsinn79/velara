import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

// Real, live price IDs created in the connected Stripe account for Velara.
export const PRICE_IDS: Record<string, string> = {
  starter: "price_1TtLHJHzysZRQBAFXv4dboow",
  growth: "price_1TtLHJHzysZRQBAFEUCiokDJ",
  scale: "price_1TtLHJHzysZRQBAFbjfQ0lNQ",
};
