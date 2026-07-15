"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SENTIMENT_COLOR: Record<string, string> = {
  positive: "bg-green-100 text-green-700",
  neutral: "bg-slate-100 text-slate-700",
  negative: "bg-red-100 text-red-700",
};

const PRIORITY_COLOR: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-700",
};

export default function DashboardClient({ feedback, plans, org }: any) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [form, setForm] = useState({ customerName: "", customerEmail: "", source: "review", content: "" });

  const newCount = feedback.filter((f: any) => f.status === "new").length;
  const negativeCount = feedback.filter((f: any) => f.sentiment === "negative").length;

  async function submitFeedback(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setAddOpen(false);
    setForm({ customerName: "", customerEmail: "", source: "review", content: "" });
    router.refresh();
  }

  async function runAnalysis() {
    setAnalyzing(true);
    await fetch("/api/analyze", { method: "POST" });
    setAnalyzing(false);
    router.refresh();
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{org?.name ?? "Velara"} — Feedback Dashboard</h1>
          <p className="text-slate-500 text-sm">Plan: {org?.plan ?? "starter"}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setAddOpen(true)} className="border border-slate-300 px-4 py-2 rounded-lg font-medium text-sm">
            + Add feedback
          </button>
          <button
            onClick={runAnalysis}
            disabled={analyzing || newCount === 0}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-40"
          >
            {analyzing ? "Analyzing..." : `Run AI analysis (${newCount} new)`}
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <Kpi label="Total feedback" value={feedback.length} />
        <Kpi label="Unanalyzed" value={newCount} />
        <Kpi label="Negative sentiment" value={negativeCount} />
        <Kpi label="Active plans" value={plans.filter((p: any) => p.status !== "shipped" && p.status !== "dismissed").length} />
      </div>

      <section className="mt-10">
        <h2 className="font-semibold text-lg">Improvement plans</h2>
        <div className="mt-4 space-y-3">
          {plans.length === 0 && <p className="text-slate-500 text-sm">No plans yet — add feedback and run AI analysis.</p>}
          {plans.map((p: any) => (
            <div key={p.id} className="border border-slate-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{p.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${PRIORITY_COLOR[p.priority] ?? ""}`}>
                  {p.priority} priority
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{p.description}</p>
              <div className="mt-2 flex gap-2 text-xs text-slate-500">
                <span>Theme: {p.theme}</span>
                <span>· Impact: {p.impact}</span>
                <span>· Effort: {p.effort}</span>
                <span>· {p.feedbackLinks?.length ?? 0} feedback items</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-semibold text-lg">Recent feedback</h2>
        <div className="mt-4 space-y-2">
          {feedback.slice(0, 20).map((f: any) => (
            <div key={f.id} className="border border-slate-200 rounded-lg p-3 bg-white flex items-center justify-between">
              <div>
                <p className="text-sm">{f.content}</p>
                <p className="text-xs text-slate-500 mt-1">{f.source} {f.customerName ? `· ${f.customerName}` : ""}</p>
              </div>
              {f.sentiment && (
                <span className={`text-xs px-2 py-1 rounded-full ${SENTIMENT_COLOR[f.sentiment] ?? ""}`}>{f.sentiment}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {addOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <form onSubmit={submitFeedback} className="bg-white p-6 rounded-xl w-full max-w-md space-y-3">
            <h3 className="font-semibold">Add feedback</h3>
            <input className="w-full border rounded-lg px-3 py-2" placeholder="Customer name (optional)"
              value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
            <input className="w-full border rounded-lg px-3 py-2" placeholder="Customer email (optional)"
              value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} />
            <select className="w-full border rounded-lg px-3 py-2" value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}>
              <option value="review">Review</option>
              <option value="support_ticket">Support ticket</option>
              <option value="survey">Survey</option>
              <option value="app_store">App store</option>
              <option value="email">Email</option>
            </select>
            <textarea className="w-full border rounded-lg px-3 py-2" placeholder="Feedback content" rows={4}
              value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAddOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
              <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm">Save</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
