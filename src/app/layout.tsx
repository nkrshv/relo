import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
