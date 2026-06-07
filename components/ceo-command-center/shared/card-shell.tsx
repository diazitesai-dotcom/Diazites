import { cn } from "@/lib/utils";

type CardShellProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  glow?: "purple" | "pink" | "green" | "none";
};

const glowMap = {
  purple: "before:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.12),transparent)]",
  pink: "before:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(236,72,153,0.1),transparent)]",
  green: "before:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,197,94,0.1),transparent)]",
  none: "",
};

export function CardShell({
  title,
  description,
  action,
  children,
  className,
  glow = "none",
}: CardShellProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c1222]/80 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl",
        "before:pointer-events-none before:absolute before:inset-0 before:content-['']",
        glowMap[glow],
        className,
      )}
    >
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title ? (
              <h3 className="text-sm font-semibold tracking-tight text-white">{title}</h3>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-xs text-slate-400">{description}</p>
            ) : null}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
