import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./dashboard-client";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const organizationId = (session as any).organizationId;

  const [feedback, plans, org] = await Promise.all([
    prisma.feedback.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.improvementPlan.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { feedbackLinks: true },
    }),
    prisma.organization.findUnique({ where: { id: organizationId } }),
  ]);

  return <DashboardClient feedback={feedback} plans={plans} org={org} />;
}
