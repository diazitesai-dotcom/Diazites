"use client";

import {
  Bot,
  Brush,
  CalendarClock,
  Headphones,
  Megaphone,
  MessageSquare,
  Receipt,
  Star,
  Target,
} from "lucide-react";

import { AgentCard } from "@/components/AgentCard";
import { SectionTitle } from "@/components/SectionTitle";

const agents = [
  {
    title: "Receptionist Agent",
    description: "Answers calls & routes urgency—never drop an inbound again.",
    icon: Headphones,
  },
  {
    title: "Sales Follow-Up Agent",
    description: "Persistent, polite outreach until meetings land on the calendar.",
    icon: MessageSquare,
  },
  {
    title: "Social Media Agent",
    description: "Drafts posts, replies to comments, keeps feeds alive.",
    icon: Brush,
  },
  {
    title: "Ads Agent",
    description: "Structures campaigns, variants, and pacing across channels.",
    icon: Megaphone,
  },
  {
    title: "CRM Agent",
    description: "Keeps records clean, stages honest, next steps obvious.",
    icon: Target,
  },
  {
    title: "Customer Support Agent",
    description: "First-line answers from your knowledge base—escalates smartly.",
    icon: Bot,
  },
  {
    title: "Appointment Booking Agent",
    description: "Qualifies, proposes slots, sends confirmations & reminders.",
    icon: CalendarClock,
  },
  {
    title: "Invoice Reminder Agent",
    description: "Polite nudges that protect cash flow without burning bridges.",
    icon: Receipt,
  },
  {
    title: "Review Request Agent",
    description: "Captures happy moments and asks for reviews at the right time.",
    icon: Star,
  },
];

export function AgentsSection() {
  return (
    <section id="agents" className="scroll-mt-28 px-5 py-28 sm:px-8">
      <SectionTitle
        eyebrow="AI agents"
        title="Specialists you can hire like teammates—without adding payroll"
        subtitle="Each agent runs workflows inside your tools. Stack them as your workload grows."
      />

      <div className="mx-auto mt-16 grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((a, i) => (
          <AgentCard
            key={a.title}
            title={a.title}
            description={a.description}
            icon={a.icon}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}
