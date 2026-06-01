import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import { chatWithAssistant } from "@/lib/api/chat.functions";
import { Sparkles, Send, X, MessageCircle } from "lucide-react";
import type { Bus, Route } from "@/lib/transit-data";
import { crowdFromPct, crowdLabel } from "@/lib/transit-data";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Which bus is less crowded right now?",
  "When is the next bus arriving?",
  "Suggest the best bus based on waiting time and occupancy.",
  "What's the expected crowd at my destination?",
];

export function Chatbot({ route, buses }: { route: Route; buses: Bus[] }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm **TransitMind**. Ask me about crowd levels, ETAs, or which bus to take." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chat = useServerFn(chatWithAssistant);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const buildContext = () => {
    const lines = [
      `Selected route: ${route.name} (${route.id})`,
      `Stops: ${route.stops.map(s => s.name).join(" → ")}`,
      `Live buses:`,
      ...buses.map(
        b =>
          `- ${b.label}: ETA ${b.etaMinutes}min, occupancy ${b.occupancyPct}% (${crowdLabel(crowdFromPct(b.occupancyPct))}), speed ${b.speedKmh}km/h, predicted next-stop occupancy ${b.predictedOccupancyNext}%`,
      ),
    ];
    return lines.join("\n");
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await chat({ data: { messages: [...messages, userMsg], context: buildContext() } });
      setMessages(prev => [...prev, { role: "assistant", content: res.reply }]);
    } catch (e) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: `⚠️ ${e instanceof Error ? e.message : "Something went wrong."}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105"
      >
        <Sparkles className="h-5 w-5" />
        Ask TransitMind
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[600px] max-h-[85vh] w-[400px] max-w-[95vw] flex-col rounded-2xl border border-border bg-card shadow-card">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
            <MessageCircle className="h-4 w-4" />
          </div>
          <div>
            <div className="font-display text-sm font-semibold">TransitMind AI</div>
            <div className="text-[10px] text-muted-foreground">Live transit assistant</div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary">
          <X className="h-4 w-4" />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`prose prose-sm prose-invert max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"
              }`}
            >
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-secondary px-3.5 py-2 text-sm">
              <span className="inline-flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.3s]" />
              </span>
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={e => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-border p-3"
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about buses, ETAs, crowds..."
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
