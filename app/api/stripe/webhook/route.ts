import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// Real Stripe webhook handler — updates org subscription status from live events.
// Register this endpoint URL in the Stripe dashboard (Developers > Webhooks) pointing to
// https://<your-domain>/api/stripe/webhook once deployed, and copy the signing secret into
// STRIPE_WEBHOOK_SECRET.
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.metadata?.organizationId;
      const tier = session.metadata?.tier;
      if (organizationId) {
        await prisma.organization.update({
          where: { id: organizationId },
          data: {
            plan: tier ?? "starter",
            stripeSubscriptionId: session.subscription as string,
            stripeSubscriptionStatus: "active",
          },
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const org = await prisma.organization.findFirst({
        where: { stripeSubscriptionId: sub.id },
      });
      if (org) {
        await prisma.organization.update({
          where: { id: org.id },
          data: { stripeSubscriptionStatus: sub.status },
        });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
