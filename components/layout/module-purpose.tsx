import { cn } from "@/lib/utils";

type ModulePurposeProps = {
  title: string;
  description: string;
  className?: string;
};

/** Operational context strip for command-center modules. */
export function ModulePurpose({ title, description, className }: ModulePurposeProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.08] bg-gradient-to-r from-violet-500/10 via-transparent to-cyan-500/10 px-4 py-3",
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300/90">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
