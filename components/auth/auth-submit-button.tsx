"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AuthSubmitButtonProps = {
  label: string;
  pendingLabel: string;
  className?: string;
  disabled?: boolean;
};

export function AuthSubmitButton({
  label,
  pendingLabel,
  className,
  disabled = false,
}: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="gradient"
      disabled={pending || disabled}
      className={cn("mt-2 w-full rounded-xl", className)}
      aria-busy={pending}
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}
