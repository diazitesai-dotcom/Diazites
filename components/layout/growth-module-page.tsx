import Link from "next/link";

import { ModulePurpose } from "@/components/layout/module-purpose";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type GrowthModulePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  purposeTitle: string;
  purposeDescription: string;
  phase?: 1 | 2 | 3;
  primaryHref?: string;
  primaryLabel?: string;
  children?: React.ReactNode;
};

export function GrowthModulePage({
  eyebrow,
  title,
  description,
  purposeTitle,
  purposeDescription,
  phase = 1,
  primaryHref = "/dashboard",
  primaryLabel = "Mission Control",
  children,
}: GrowthModulePageProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <ModulePurpose title={purposeTitle} description={purposeDescription} />
      {children}
      <Card className="border-white/[0.08]">
        <CardHeader>
          <CardTitle className="text-base">Phase {phase} module</CardTitle>
          <CardDescription>
            UI shell is live; connect real APIs in Phase {phase === 1 ? 2 : 3} per the growth platform
            roadmap.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={primaryHref}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}
          >
            {primaryLabel}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
