import { SITE_URL } from "@/lib/siteUrls";

// Transactional email through Resend, sent from the verified send.reloka.to
// subdomain (the root reloka.to stays on Zoho). Configured server-side only
// via RESEND_API_KEY; without it we skip sending and the caller falls back to
// the on-screen copy link.
const FROM = "Reloka <hello@send.reloka.to>";

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

// Send the buyer their permanent plan link so they can return from any device.
// Returns true only when Resend accepted the message.
export async function sendPlanLinkEmail(
  to: string,
  slug: string,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const url = `${SITE_URL}/plan/${slug}`;
  const subject = "Your Reloka relocation plan";
  const text = [
    "Thanks for unlocking your full relocation plan.",
    "",
    "Open it any time, from any device, with this link:",
    url,
    "",
    "Bookmark it — this is the permanent link to your plan.",
  ].join("\n");
  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1917;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e7e5e4;border-radius:12px;padding:32px;">
            <tr><td style="font-size:18px;font-weight:600;padding-bottom:12px;">Your relocation plan is ready</td></tr>
            <tr><td style="font-size:14px;line-height:1.6;color:#44403c;padding-bottom:24px;">
              Thanks for unlocking your full plan. Open it any time, from any device, with the link below. Bookmark it — this is the permanent link to your plan.
            </td></tr>
            <tr><td style="padding-bottom:24px;">
              <a href="${url}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:8px;">Open my plan</a>
            </td></tr>
            <tr><td style="font-size:12px;line-height:1.6;color:#78716c;word-break:break-all;">
              Or paste this link into your browser:<br />
              <a href="${url}" style="color:#78716c;">${url}</a>
            </td></tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;padding-top:16px;">
            <tr><td align="center" style="font-size:12px;color:#a8a29e;">Reloka · reloka.to</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, text, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
