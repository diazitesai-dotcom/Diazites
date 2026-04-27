import OpenAI from "openai";

import { assertRequiredEnv, env } from "@/lib/env";

export async function generateLeadFollowUp(input: {
  leadName: string;
  roofingNeed: string;
  businessName: string;
}) {
  assertRequiredEnv(["OPENAI_API_KEY"]);
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  const prompt = `Write a short professional roofing follow-up email.
Lead name: ${input.leadName}
Roofing need: ${input.roofingNeed}
Business: ${input.businessName}
Tone: friendly, local, action-oriented.
Include a clear next step asking to confirm best time for a quick estimate call.`;

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  return response.output_text;
}
