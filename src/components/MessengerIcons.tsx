import type { MessengerReachability } from "@/lib/countryCensorship";
import { reachabilityLabel } from "@/lib/countryCensorship";

const GLYPHS: Record<string, React.ReactNode> = {
  Telegram: (
    <path d="M20.7 3.4 2.9 10.3c-1 .4-1 1.4-.2 1.7l4.5 1.4 1.7 5.3c.2.6 1 .8 1.5.3l2.4-2.3 4.7 3.4c.6.4 1.4.1 1.6-.6l3-14.7c.2-1-.5-1.7-1.4-1.4ZM8.5 13l9.3-5.8c.4-.3.8.3.5.6l-7.7 7-.3 3-1.8-4.8Z" />
  ),
  WhatsApp: (
    <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18.2c-1.6 0-3.1-.5-4.4-1.3l-.3-.2-3 .8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.5.2-.8l.4-.5c.1-.2.1-.4 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.9.9-1.2 2.2-.2 3.9a11.6 11.6 0 0 0 4.6 4.3c1.9.9 2.6.8 3.5.7.6 0 1.6-.6 1.8-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.1-.5-.2Z" />
  ),
  Signal: (
    <path d="M12 2.5a9.5 9.5 0 0 0-8 14.6l-1 4.4 4.4-1A9.5 9.5 0 1 0 12 2.5Zm0 1.7a7.8 7.8 0 1 1-4 14.5l-.3-.2-2.5.6.6-2.5-.2-.3A7.8 7.8 0 0 1 12 4.2Zm0 1.6a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4Z" />
  ),
  "Facebook Messenger": (
    <path d="M12 2C6.5 2 2.2 6.1 2.2 11.3c0 2.9 1.4 5.5 3.5 7.2v3.5l3.3-1.8c.9.2 1.9.4 3 .4 5.5 0 9.8-4.1 9.8-9.3S17.5 2 12 2Zm1 12.5-2.5-2.7-4.9 2.7 5.4-5.7 2.6 2.7 4.8-2.7-5.4 5.7Z" />
  ),
};

/**
 * Inline messenger logos for a country's OONI reachability data.
 * Reachable apps render in full stone ink; disrupted ones are dimmed.
 */
export default function MessengerIcons({
  messengers,
}: {
  messengers: MessengerReachability[];
}) {
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      {messengers.map((m) => {
        const ok = m.status === "reachable";
        return (
          <svg
            key={m.app}
            viewBox="0 0 24 24"
            role="img"
            aria-label={`${m.app}: ${reachabilityLabel(m.status).text}`}
            className={`h-4 w-4 ${ok ? "fill-stone-700" : "fill-stone-300"}`}
          >
            <title>{`${m.app}: ${reachabilityLabel(m.status).text}`}</title>
            {GLYPHS[m.app] ?? (
              <circle cx="12" cy="12" r="9" />
            )}
          </svg>
        );
      })}
    </span>
  );
}
