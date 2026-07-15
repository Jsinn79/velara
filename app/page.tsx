import Link from "next/link";

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-24">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">Velara</h1>
        <p className="mt-4 text-xl text-slate-600">
          AI turns your customer feedback into a prioritized product roadmap —
          built for e-commerce product managers.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/signup" className="bg-slate-900 text-white px-6 py-3 rounded-lg font-medium">
            Start free trial
          </Link>
          <Link href="/pricing" className="border border-slate-300 px-6 py-3 rounded-lg font-medium">
            See pricing
          </Link>
        </div>
      </div>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        <Feature title="Ingest everything" desc="Reviews, support tickets, surveys, app store feedback — one pipeline." />
        <Feature title="AI does the reading" desc="Automatic sentiment + theme clustering across thousands of items." />
        <Feature title="Ship a real plan" desc="Prioritized improvement plans with impact/effort scoring, synced to GitHub." />
      </div>
    </main>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-6 rounded-xl bg-white border border-slate-200">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-slate-600">{desc}</p>
    </div>
  );
}
