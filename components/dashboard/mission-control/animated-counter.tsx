"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

export function useAnimatedNumber(target: number, duration = 0.9) {
  const spring = useSpring(0, { stiffness: 90, damping: 22 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    spring.set(target);
    const unsub = spring.on("change", (v) => setDisplay(Math.round(v)));
    return () => unsub();
  }, [spring, target]);

  return display;
}

export function AnimatedCounter({
  value,
  format = (n) => String(n),
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const n = useAnimatedNumber(value);
  return (
    <motion.span
      key={value}
      className={className}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {format(n)}
    </motion.span>
  );
}

export function AnimatedMoney({ value, className }: { value: number; className?: string }) {
  return (
    <AnimatedCounter
      value={value}
      className={className}
      format={(n) =>
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(n)
      }
    />
  );
}
