import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TransitMind · Smart Bus Crowd Monitoring & AI Recommendations" },
      { name: "description", content: "Live bus tracking with AI crowd prediction. See real-time occupancy, ETAs, and get smart recommendations on which bus to take." },
      { property: "og:title", content: "TransitMind · Smart Bus Crowd Monitoring" },
      { property: "og:description", content: "Live bus tracking with AI crowd prediction and smart recommendations." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" },
    ],
  }),
  component: Index,
});

function Index() {
  return <Dashboard />;
}
