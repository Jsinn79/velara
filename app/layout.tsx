import "./globals.css";

export const metadata = {
  title: "Velara — AI product feedback, turned into a roadmap",
  description: "Velara analyzes customer feedback and generates actionable product improvement plans for e-commerce teams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
