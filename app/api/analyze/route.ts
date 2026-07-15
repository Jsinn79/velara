import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// POST /api/analyze — runs AI analysis over all "new" feedback for the org:
// 1. classifies sentiment + theme for each item
// 2. clusters themes into actionable improvement plans (creates or updates them)
// This is the core Velara pipeline product managers rely on.
export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const organizationId = (session as any).organizationId;

  const newFeedback = await prisma.feedback.findMany({
    where: { organizationId, status: "new" },
  });

  if (newFeedback.length === 0) {
    return NextResponse.json({ ok: true, analyzed: 0, plansCreated: 0 });
  }

  // Step 1: classify each feedback item (sentiment + theme)
  const classifyPrompt = `You are a product analyst for an e-commerce platform. For each customer
feedback item below, return JSON array with objects {id, sentiment, theme}. sentiment is one of
positive|neutral|negative. theme is a short lowercase tag such as checkout, shipping, pricing,
search, mobile_app, returns, support, product_quality, performance, other.

Feedback items:
${newFeedback.map((f) => `- id=${f.id}: ${f.content}`).join("\n")}

Respond with ONLY a JSON array, no prose.`;

  const classifyRes = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: classifyPrompt }],
    temperature: 0,
  });

  let classified: { id: string; sentiment: string; theme: string }[] = [];
  try {
    classified = JSON.parse(classifyRes.choices[0].message.content ?? "[]");
  } catch {
    return NextResponse.json({ error: "AI classification parse failure" }, { status: 502 });
  }

  for (const c of classified) {
    await prisma.feedback.update({
      where: { id: c.id },
      data: { sentiment: c.sentiment, theme: c.theme, status: "analyzed" },
    });
  }

  // Step 2: group by theme, generate/refresh an improvement plan per theme with enough volume
  const themeGroups = new Map<string, typeof newFeedback>();
  for (const c of classified) {
    const item = newFeedback.find((f) => f.id === c.id);
    if (!item) continue;
    const arr = themeGroups.get(c.theme) ?? [];
    arr.push(item);
    themeGroups.set(c.theme, arr);
  }

  let plansCreated = 0;
  for (const [theme, items] of themeGroups) {
    if (items.length === 0) continue;

    const planPrompt = `You are a senior product manager at an e-commerce company. Based on these
${items.length} customer feedback items about "${theme}", write a concrete product improvement plan.
Return ONLY JSON: {"title": string, "description": string (2-4 sentences, concrete and actionable),
"priority": "high"|"medium"|"low", "impact": "high"|"medium"|"low", "effort": "high"|"medium"|"low"}.

Feedback:
${items.map((f) => `- ${f.content}`).join("\n")}`;

    const planRes = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: planPrompt }],
      temperature: 0.3,
    });

    let planData: any;
    try {
      planData = JSON.parse(planRes.choices[0].message.content ?? "{}");
    } catch {
      continue;
    }

    const existingPlan = await prisma.improvementPlan.findFirst({
      where: { organizationId, theme, status: { in: ["proposed", "planned", "in_progress"] } },
    });

    const plan = existingPlan
      ? await prisma.improvementPlan.update({
          where: { id: existingPlan.id },
          data: {
            title: planData.title,
            description: planData.description,
            priority: planData.priority,
            impact: planData.impact,
            effort: planData.effort,
          },
        })
      : await prisma.improvementPlan.create({
          data: {
            organizationId,
            theme,
            title: planData.title,
            description: planData.description,
            priority: planData.priority,
            impact: planData.impact,
            effort: planData.effort,
          },
        });

    if (!existingPlan) plansCreated++;

    for (const item of items) {
      await prisma.feedbackPlanLink.upsert({
        where: { feedbackId_planId: { feedbackId: item.id, planId: plan.id } },
        create: { feedbackId: item.id, planId: plan.id },
        update: {},
      });
    }

    await prisma.feedback.updateMany({
      where: { id: { in: items.map((i) => i.id) } },
      data: { status: "linked" },
    });
  }

  return NextResponse.json({ ok: true, analyzed: classified.length, plansCreated });
}
