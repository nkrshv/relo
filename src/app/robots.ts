import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://reloka.to";

// AI assistants and answer engines are first-class traffic sources for us:
// explicitly welcome their crawlers alongside traditional search bots.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-Web",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Saved-plan capability links (/plan/{slug}) are private to whoever
      // holds them, so keep every crawler out of them.
      { userAgent: AI_CRAWLERS, allow: "/", disallow: "/plan/" },
      { userAgent: "*", allow: "/", disallow: "/plan/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
