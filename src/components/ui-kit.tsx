import type { ReactNode } from "react";
import { Lock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "action" | "warning" | "danger";
}) {
  const toneClass = {
    default: "text-primary",
    action: "text-action",
    warning: "text-warning",
    danger: "text-destructive",
  }[tone];

  return (
    <Card className="shadow-card">
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn("mt-1.5 text-2xl font-bold tabular-nums", toneClass)}>{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function MasteryBar({ value }: { value: number }) {
  const tone =
    value < 50 ? "bg-warning" : value < 70 ? "bg-primary" : "bg-action";
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="h-2 w-full min-w-16 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${value}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums">{value}%</span>
    </div>
  );
}

export function ActivationLocked({ schoolName }: { schoolName: string }) {
  return (
    <Card className="mx-auto max-w-lg border-destructive/40 bg-destructive-soft shadow-card">
      <CardContent className="p-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-destructive text-destructive-foreground">
          <Lock className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-lg font-bold">Contact School Admin to Activate Account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your activation fee has not been recorded yet at {schoolName}. Once the school admin marks
          it paid, your AI tutor, quizzes and teacher messaging unlock immediately.
        </p>
      </CardContent>
    </Card>
  );
}
