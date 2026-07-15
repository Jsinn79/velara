import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GitHub OAuth callback for Velara CUSTOMERS connecting their own repos.
// Requires a GitHub OAuth App registered by you (the Velara operator) at
// https://github.com/settings/developers with callback URL:
//   https://<your-domain>/api/integrations/github/callback
// Client ID/secret go into GITHUB_OAUTH_CLIENT_ID / GITHUB_OAUTH_CLIENT_SECRET env vars.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.redirect(new URL("/login", req.url));

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/dashboard/integrations?error=missing_code", req.url));

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
      code,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return NextResponse.redirect(new URL("/dashboard/integrations?error=token_exchange_failed", req.url));
  }

  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const ghUser = await userRes.json();

  const organizationId = (session as any).organizationId;
  await prisma.integration.upsert({
    where: { organizationId_provider: { organizationId, provider: "github" } },
    create: {
      organizationId,
      provider: "github",
      accessToken: tokenData.access_token,
      accountLabel: ghUser.login,
    },
    update: {
      accessToken: tokenData.access_token,
      accountLabel: ghUser.login,
    },
  });

  return NextResponse.redirect(new URL("/dashboard/integrations?connected=github", req.url));
}
