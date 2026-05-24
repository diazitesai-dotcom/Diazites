"use client";

import { motion } from "framer-motion";
import { SectionTitle } from "@/components/SectionTitle";

const nodes = [
  "Lead Comes In",
  "AI Replies",
  "CRM Updated",
  "Appointment Booked",
  "Follow-Up Sent",
];

export function WorkflowDemo() {
  return (
    <section id="workflow" className="scroll-mt-28 px-5 py-28 sm:px-8">
      <SectionTitle
        eyebrow="Live workflow"
        title="Watch data flow through your business—in real time"
      />

      <div className="relative mx-auto mt-20 max-w-6xl">
        <div className="pointer-events-none absolute left-[10%] right-[10%] top-[52%] hidden h-0.5 md:block">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 via-cyan-400 to-fuchsia-500 opacity-40"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "left" }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-60"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="flex flex-col items-stretch gap-6 md:flex-row md:flex-wrap md:justify-between md:gap-4">
          {nodes.map((label, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative flex flex-1 flex-col items-center md:min-w-0 md:flex-1"
            >
              <motion.div
                className="relative z-10 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-6 text-center backdrop-blur-xl"
                animate={{
                  boxShadow: [
                    "0 0 20px -8px rgba(34,211,238,0.2)",
                    "0 0 36px -4px rgba(139,92,246,0.35)",
                    "0 0 20px -8px rgba(34,211,238,0.2)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.35 }}
              >
                <span className="text-sm font-semibold text-white">{label}</span>
                <motion.span
                  className="mt-3 mx-auto block size-2 rounded-full bg-cyan-400"
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                />
              </motion.div>
              {i < nodes.length - 1 ? (
                <span className="my-2 text-cyan-400/80 md:hidden">↓</span>
              ) : null}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
