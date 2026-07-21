import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChatGPT Image Generator - OpenAI gpt-image-2",
  description:
    "Production-grade Personal ChatGPT-style AI Image Generator powered by OpenAI gpt-image-2 model and Next.js 15 App Router.",
  keywords: ["AI Image Generator", "ChatGPT Image", "OpenAI", "gpt-image-2", "Next.js 15"],
  authors: [{ name: "OpenAI ChatGPT Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen flex flex-col bg-[#0d0d0e] text-zinc-100 antialiased selection:bg-emerald-500 selection:text-zinc-950">
        {children}
      </body>
    </html>
  );
}
