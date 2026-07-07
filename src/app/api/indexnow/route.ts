import { INDEXNOW_KEY } from "@/lib/indexnow";
import { SITE_URL, allSiteUrls } from "@/lib/siteUrls";

export const runtime = "nodejs";

// At most one upstream submission per window per instance; the weekly cron is
// the only intended caller, so anything more frequent is dropped.
const SUBMIT_WINDOW_MS = 60 * 60 * 1000;
let lastSubmittedAt = 0;

// Submits every site URL to IndexNow (Bing, Yandex, Seznam, Naver share the
// endpoint). Triggered by the Vercel cron in vercel.json; harmless to re-run.
export async function GET(request: Request): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = Date.now();
  if (now - lastSubmittedAt < SUBMIT_WINDOW_MS) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  lastSubmittedAt = now;

  const urlList = allSiteUrls();
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(SITE_URL).host,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/indexnow-key.txt`,
      urlList,
    }),
  });

  return Response.json({
    submitted: urlList.length,
    indexnowStatus: res.status,
  });
}
