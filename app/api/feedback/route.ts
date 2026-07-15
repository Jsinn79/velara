import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  source: z.string(),
  content: z.string().min(1),
});

// POST /api/feedback — ingest a single feedback item.
// Can be called from the dashboard UI, or from an external source (support tool,
// review platform, survey webhook) using an org API key in the future.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const feedback = await prisma.feedback.create({
    data: {
      organizationId: (session as any).organizationId,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      source: parsed.data.source,
      content: parsed.data.content,
    },
  });

  return NextResponse.json({ ok: true, feedback });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const items = await prisma.feedback.findMany({
    where: { organizationId: (session as any).organizationId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ items });
}
