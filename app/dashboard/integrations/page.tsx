import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Integrations() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const organizationId = (session as any).organizationId;
  const integrations = await prisma.integration.findMany({ where: { organizationId } });
  const github = integrations.find((i) => i.provider === "github");
  const vercel = integrations.find((i) => i.provider === "vercel");

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_OAUTH_CLIENT_ID}&scope=repo`;
  const vercelAuthUrl = `https://vercel.com/integrations/velara/new`; // replace with your Vercel Integration's install URL once registered

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold">Integrations</h1>
      <p className="text-slate-500 text-sm mt-1">Sync improvement plans to your engineering workflow.</p>

      <div className="mt-8 space-y-4">
        <IntegrationCard
          name="GitHub"
          connected={!!github}
          label={github?.accountLabel}
          connectUrl={githubAuthUrl}
          desc="Push improvement plans as GitHub issues in your repo."
        />
        <IntegrationCard
          name="Vercel"
          connected={!!vercel}
          label={vercel?.accountLabel}
          connectUrl={vercelAuthUrl}
          desc="See deploy status next to shipped improvement plans."
        />
      </div>
    </main>
  );
}

function IntegrationCard({ name, connected, label, connectUrl, desc }: any) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white flex items-center justify-between">
      <div>
        <h3 className="font-medium">{name}</h3>
        <p className="text-sm text-slate-500">{desc}</p>
        {connected && <p className="text-xs text-green-600 mt-1">Connected as {label}</p>}
      </div>
      {connected ? (
        <span className="text-sm text-green-700 font-medium">Connected</span>
      ) : (
        <a href={connectUrl} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium">
          Connect
        </a>
      )}
    </div>
  );
}
