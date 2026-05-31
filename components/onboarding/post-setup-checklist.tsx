import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PostSetupChecklistItem } from "@/lib/onboarding/draft";
import { cn } from "@/lib/utils";

export function PostSetupChecklist({
  items,
  alwaysShow = false,
  className,
}: {
  items: PostSetupChecklistItem[];
  alwaysShow?: boolean;
  className?: string;
}) {
  const pending = items.filter((item) => !item.done);
  if (!alwaysShow && pending.length === 0) return null;

  const doneCount = items.filter((item) => item.done).length;

  return (
    <Card className={cn("border-violet-500/25 bg-violet-500/[0.06]", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Finish setting up</CardTitle>
        <CardDescription>
          {doneCount} of {items.length} launch steps complete — knock out the rest when you are
          ready.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="flex items-start gap-3 rounded-lg border border-white/[0.06] bg-background/40 px-3 py-2.5 transition-colors hover:border-violet-500/30 hover:bg-violet-500/5"
              >
                {item.done ? (
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-emerald-400"
                    aria-hidden
                  />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <span className="min-w-0">
                  <span
                    className={
                      item.done
                        ? "text-sm text-muted-foreground line-through"
                        : "text-sm font-medium text-foreground"
                    }
                  >
                    {item.label}
                  </span>
                  {!item.done ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
