"use client";

import { MessageCircle } from "lucide-react";

export function FloatingChatButton() {
  return (
    <button
      type="button"
      aria-label="Open AI chat"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-[0_8px_32px_rgba(99,102,241,0.45)] transition hover:scale-105 hover:shadow-[0_12px_40px_rgba(99,102,241,0.55)]"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
}
