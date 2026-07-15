const TIERS = [
  {
    tier: "starter",
    name: "Starter",
    price: 49,
    features: ["Up to 500 feedback items/mo", "AI theme clustering", "Improvement plan generator", "1 GitHub + 1 Vercel integration"],
  },
  {
    tier: "growth",
    name: "Growth",
    price: 149,
    features: ["Up to 5,000 feedback items/mo", "Priority AI analysis", "Unlimited improvement plans", "Unlimited GitHub + Vercel integrations", "Team seats (up to 5)"],
    highlight: true,
  },
  {
    tier: "scale",
    name: "Scale",
    price: 399,
    features: ["Unlimited feedback volume", "Custom AI theme models", "Advanced roadmap workflows", "Unlimited team seats", "Priority support"],
  },
];

export default function Pricing() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-bold text-center">Pricing</h1>
      <p className="text-center text-slate-600 mt-2">Monthly subscriptions, cancel anytime.</p>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {TIERS.map((t) => (
          <div
            key={t.tier}
            className={`p-6 rounded-xl border ${t.highlight ? "border-slate-900 shadow-lg" : "border-slate-200"} bg-white`}
          >
            <h2 className="font-semibold text-xl">{t.name}</h2>
            <p className="mt-2 text-3xl font-bold">
              ${t.price}
              <span className="text-base font-normal text-slate-500">/mo</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {t.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            <a
              href={`/signup?tier=${t.tier}`}
              className="mt-6 block text-center bg-slate-900 text-white py-2.5 rounded-lg font-medium"
            >
              Choose {t.name}
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}
