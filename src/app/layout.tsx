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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://relochecklist.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ReloChecklist: your personalized relocation checklist",
    template: "%s · ReloChecklist",
  },
  description:
    "Get a personalized, step-by-step relocation checklist for moving to any country: visa, housing, banking, healthcare and more, tailored to your situation.",
  openGraph: {
    title: "ReloChecklist: your personalized relocation checklist",
    description:
      "A step-by-step relocation plan tailored to where you're moving, your visa status, and your family situation.",
    type: "website",
    url: SITE_URL,
  },
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
        {children}
      </body>
    </html>
  );
}
