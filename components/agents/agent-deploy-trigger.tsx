"use client";

import type { ComponentProps } from "react";

import { useAgentDeploymentOptional } from "@/components/agents/agent-deployment-provider";
import { inferGoalFromHref } from "@/lib/agents/deployment-catalog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DeploymentLaunchParams } from "@/types/agent-deployment";

type Props = {
  label: string;
  href?: string;
  deploy?: DeploymentLaunchParams;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
  icon?: React.ReactNode;
};

export function AgentDeployTrigger({
  label,
  href,
  deploy,
  variant = "gradient",
  size,
  className,
  icon,
}: Props) {
  const deployment = useAgentDeploymentOptional();

  if (!deployment) {
    return (
      <a href={href ?? "/dashboard/agents?deploy=1"} className={cn(buttonVariants({ variant, size }), className)}>
        {icon}
        {label}
      </a>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() =>
        deployment.openDeployment({
          ...deploy,
          goal: deploy?.goal ?? (href ? inferGoalFromHref(href) : undefined),
          source: deploy?.source ?? "quick_action",
        })
      }
    >
      {icon ? <span className="inline-flex items-center gap-1.5">{icon}{label}</span> : label}
    </Button>
  );
}
