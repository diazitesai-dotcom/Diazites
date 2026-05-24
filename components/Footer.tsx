import Link from "next/link";

const year = new Date().getFullYear();

const colA = [
  { label: "Vision", href: "#what-we-do" },
  { label: "Programs", href: "#how-it-works" },
  { label: "Agents", href: "#agents" },
];

const colB = [
  { label: "Workflow demo", href: "#workflow" },
  { label: "Pricing", href: "#pricing" },
  { label: "Get started", href: "#final-cta" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.07] bg-[#050810]/95 px-5 py-20 backdrop-blur-xl sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-14 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Link href="#top" className="font-display text-xl font-medium tracking-tight text-white">
            Diazites <span className="text-sky-300/90">AI</span>
          </Link>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/45">
            Digital workers for small businesses—deployable, accountable, and built to
            keep your operations moving forward.
          </p>
        </div>

        <div>
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.28em] text-white/35">
            Helpful links
          </p>
          <ul className="mt-6 space-y-3">
            {colA.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="text-sm text-white/55 transition hover:text-white"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.28em] text-white/35">
            Explore
          </p>
          <ul className="mt-6 space-y-3">
            {colB.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="text-sm text-white/55 transition hover:text-white"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mx-auto mt-16 max-w-7xl border-t border-white/[0.06] pt-10 text-center text-xs text-white/30">
        Copyright © {year} · Diazites AI. All rights reserved.
      </p>
    </footer>
  );
}
