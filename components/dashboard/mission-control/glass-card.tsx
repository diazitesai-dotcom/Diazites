import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type GlassCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headerExtra?: ReactNode;
  contentClassName?: string;
};

export function GlassCard({
  title,
  description,
  children,
  className,
  headerExtra,
  contentClassName,
}: GlassCardProps) {
  return (
    <Card
      className={cn(
        "border-white/[0.08] bg-gradient-to-br from-card/90 via-card/70 to-violet-950/20 shadow-[0_8px_40px_-24px_rgba(0,0,0,0.8)] backdrop-blur-sm transition-all duration-300 hover:border-violet-500/15 hover:shadow-[0_12px_48px_-20px_rgba(139,92,246,0.2)]",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
          {description ? <CardDescription className="text-xs">{description}</CardDescription> : null}
        </div>
        {headerExtra}
      </CardHeader>
      <CardContent className={cn("pt-0", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
