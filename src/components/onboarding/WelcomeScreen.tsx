"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Building2,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomeScreenProps {
  userName?: string;
  onGetStarted: () => void;
  onSkip?: () => void;
  className?: string;
}

const features = [
  {
    icon: Users,
    title: "Manage Contacts",
    description: "Keep track of all your relationships in one place",
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    icon: Building2,
    title: "Track Companies",
    description: "Organize accounts and monitor company activity",
    color: "text-violet-500",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    icon: TrendingUp,
    title: "Close Deals",
    description: "Visual pipeline to manage your sales process",
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    icon: MessageSquare,
    title: "Stay Connected",
    description: "Track all conversations and activities",
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
  },
];

export function WelcomeScreen({
  userName,
  onGetStarted,
  onSkip,
  className,
}: WelcomeScreenProps) {
  return (
    <div
      className={cn(
        "flex min-h-[80vh] flex-col items-center justify-center px-4 py-12",
        className
      )}
    >
      {/* Welcome Header */}
      <div className="relative mb-8 flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-blue-500/20 via-violet-500/20 to-emerald-500/20" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-violet-500">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
      </div>

      <h1 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
        {userName ? `Welcome, ${userName}!` : "Welcome to your CRM"}
      </h1>

      <p className="mx-auto mt-4 max-w-lg text-center text-lg text-zinc-500 dark:text-zinc-400">
        Your all-in-one platform for managing relationships, tracking deals, and
        growing your business. Let&apos;s get you set up.
      </p>

      {/* Feature Cards */}
      <div className="mt-12 grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        {features.map((feature, index) => (
          <Card
            key={feature.title}
            className="group relative overflow-hidden border-zinc-200 transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:hover:border-zinc-700"
          >
            <CardContent className="flex items-start gap-4 p-5">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110",
                  feature.bgColor
                )}
              >
                <feature.icon className={cn("h-5 w-5", feature.color)} />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {feature.title}
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {feature.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* What you'll set up */}
      <div className="mt-12 rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Quick setup takes about 2 minutes:
        </h3>
        <ul className="mt-4 space-y-3">
          {[
            "Set up your first sales pipeline",
            "Add your first contact or company",
            "Explore the dashboard",
          ].map((step, index) => (
            <li key={index} className="flex items-center gap-3 text-sm">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-zinc-600 dark:text-zinc-300">{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
        <Button size="lg" onClick={onGetStarted} className="gap-2 px-8">
          Get Started
          <ArrowRight className="h-4 w-4" />
        </Button>
        {onSkip && (
          <Button variant="ghost" size="lg" onClick={onSkip}>
            Skip for now
          </Button>
        )}
      </div>
    </div>
  );
}
