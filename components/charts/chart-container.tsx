"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ChartSize = { width: number; height: number };

type ChartContainerProps = {
  className?: string;
  minHeight?: number;
  children: (size: ChartSize) => ReactNode;
};

/**
 * Measures its box and only renders chart children once width/height are known.
 * Avoids Recharts ResponsiveContainer measuring -1 when the parent has no layout yet.
 */
export function ChartContainer({ className, minHeight = 140, children }: ChartContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ChartSize | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);
      if (width > 0 && height > 0) {
        setSize((prev) =>
          prev?.width === width && prev.height === height ? prev : { width, height },
        );
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("w-full min-w-0", className)} style={{ minHeight }}>
      {size ? (
        children(size)
      ) : (
        <div className="h-full min-h-[inherit] w-full animate-pulse rounded-xl bg-white/[0.04]" aria-hidden />
      )}
    </div>
  );
}
