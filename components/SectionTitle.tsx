"use client";

import { motion } from "framer-motion";

type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  dark?: boolean;
};

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  align = "center",
  dark = true,
}: SectionTitleProps) {
  const text = dark ? "text-white" : "text-foreground";
  const muted = dark ? "text-white/50" : "text-muted-foreground";
  const eyebrowCls = dark ? "text-sky-200/65" : "text-primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
      className={
        align === "center"
          ? "mx-auto max-w-4xl text-center"
          : "mx-auto max-w-4xl text-left"
      }
    >
      {eyebrow ? (
        <p
          className={`font-display mb-5 text-[11px] font-medium uppercase tracking-[0.38em] ${eyebrowCls}`}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`font-display text-balance text-3xl font-light tracking-tight sm:text-4xl md:text-5xl lg:text-[3rem] ${text}`}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={`mt-6 max-w-2xl text-base leading-relaxed md:text-lg ${muted} ${align === "center" ? "mx-auto" : ""}`}
        >
          {subtitle}
        </p>
      ) : null}
    </motion.div>
  );
}
