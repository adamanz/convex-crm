import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Toaster } from "sonner";
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
        <ConvexClientProvider>
          <div className="flex h-screen overflow-hidden">
            <AppSidebar />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
          <Toaster
            position="top-right"
            theme="dark"
            richColors
            closeButton
          />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
