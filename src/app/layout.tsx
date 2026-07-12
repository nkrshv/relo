import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const GTM_ID = "GTM-TK4LCSRM";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://reloka.to";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Reloka: your personalized relocation checklist",
    template: "%s · Reloka",
  },
  description:
    "Get a personalized, step-by-step relocation checklist for moving to any country: visa, housing, banking, healthcare and more, tailored to your situation.",
  openGraph: {
    title: "Reloka: your personalized relocation checklist",
    description:
      "A step-by-step relocation plan tailored to where you're moving, your visa status, and your family situation.",
    type: "website",
    url: SITE_URL,
    siteName: "Reloka",
  },
  verification: {
    google: "hBokM3_MXEoaXjh8r4e5MC0ditw2s81ef9OfiYTKxkM",
    other: { "msvalidate.01": "53BEF374BC42F93B4DFEE3EBBC359ED6" },
  },
  twitter: {
    card: "summary_large_image",
    title: "Reloka: your personalized relocation checklist",
    description:
      "A step-by-step relocation plan tailored to where you're moving, your visa status, and your family situation.",
  },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Reloka",
      url: SITE_URL,
      description:
        "Reloka builds personalized, step-by-step relocation checklists for moving to any country, with dated, source-linked country facts.",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Reloka",
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
