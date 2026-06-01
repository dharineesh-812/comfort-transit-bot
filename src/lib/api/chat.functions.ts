import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(4000),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(40),
  context: z.string().max(8000).optional(),
});

export const chatWithAssistant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are TransitMind, an AI assistant for a smart public transport crowd-monitoring app.
You help passengers choose the best bus based on live crowd density, ETA, and route info.
Be concise (1-3 short sentences), friendly, and actionable. Use the LIVE TRANSIT DATA below to answer.
If the user asks something unrelated to transit, gently steer back.

LIVE TRANSIT DATA:
${data.context ?? "(no data)"}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...data.messages],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) throw new Error("Rate limit reached. Please wait a moment.");
      if (resp.status === 402) throw new Error("AI credits exhausted. Please top up in Settings → Workspace → Usage.");
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      throw new Error("AI assistant is unavailable right now.");
    }

    const json = await resp.json();
    const reply = json.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";
    return { reply };
  });
