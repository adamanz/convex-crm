import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { CreateFAB } from "@/components/layout/create-fab";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM | Modern Customer Relationship Management",
  description: "A modern, real-time CRM built on Convex with AI-powered features",
  keywords: ["CRM", "sales", "contacts", "deals", "pipeline", "AI"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          richColors
          closeButton
        />

        {/* Create FAB - accessible from all pages */}
        <CreateFAB />

        {/* ElevenLabs ConvAI Widget v2 */}
        {process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  (function() {
                    const container = document.createElement('div');
                    container.innerHTML = '<elevenlabs-convai agent-id="${process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID}"></elevenlabs-convai>';
                    document.body.appendChild(container.firstChild);
                  })();
                `,
              }}
            />
            <script
              src="https://unpkg.com/@elevenlabs/convai-widget-embed@beta"
              async
              type="text/javascript"
            />
          </>
        )}
      </body>
    </html>
  );
}
