import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Vercel OAuth callback for Velara CUSTOMERS connecting their own projects.
// Requires a Vercel Integration registered by you at https://vercel.com/dashboard/integrations
// with redirect URL: https://<your-domain>/api/integrations/vercel/callback
// Client ID/secret go into VERCEL_OAUTH_CLIENT_ID / VERCEL_OAUTH_CLIENT_SECRET env vars.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.redirect(new URL("/login", req.url));

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/dashboard/integrations?error=missing_code", req.url));

  const tokenRes = await fetch("https://api.vercel.com/v2/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.VERCEL_OAUTH_CLIENT_ID as string,
      client_secret: process.env.VERCEL_OAUTH_CLIENT_SECRET as string,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/vercel/callback`,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return NextResponse.redirect(new URL("/dashboard/integrations?error=token_exchange_failed", req.url));
  }

  const organizationId = (session as any).organizationId;
  await prisma.integration.upsert({
    where: { organizationId_provider: { organizationId, provider: "vercel" } },
    create: {
      organizationId,
      provider: "vercel",
      accessToken: tokenData.access_token,
      accountLabel: tokenData.team_id ?? "personal",
    },
    update: {
      accessToken: tokenData.access_token,
      accountLabel: tokenData.team_id ?? "personal",
    },
  });

  return NextResponse.redirect(new URL("/dashboard/integrations?connected=vercel", req.url));
}
