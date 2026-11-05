import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  GraduationCap,
  LayoutDashboard,
  Menu,
  LifeBuoy,
  Moon,
  Sparkles,
  Sun,
  ClipboardList,
  BookOpen,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useActivePersona, useAppStore } from "@/store/app-store";
import type { Role } from "@/lib/seed-data";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; roles: Role[] };

const NAV: NavItem[] = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["system_admin", "school_admin", "teacher", "student"],
  },
  {
    to: "/schools",
    label: "Schools & Activation",
    icon: Building2,
    roles: ["system_admin", "school_admin"],
  },
  { to: "/classroom", label: "Classroom", icon: BookOpen, roles: ["teacher"] },
  { to: "/tutor", label: "AI Tutor", icon: Sparkles, roles: ["student"] },
  {
    to: "/practice",
    label: "Practice Quizzes",
    icon: ClipboardList,
    roles: ["student", "teacher"],
  },
  {
    to: "/messages",
    label: "Escalate to Teacher",
    icon: LifeBuoy,
    roles: ["student", "teacher"],
  },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-brand">
        <GraduationCap className="h-5 w-5" />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block truncate text-base font-bold leading-tight tracking-tight">
            Scholaris
          </span>
          <span className="block truncate text-[11px] text-muted-foreground">Lagos Pilot</span>
        </span>
      )}
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const persona = useActivePersona();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const items = NAV.filter((i) => i.roles.includes(persona.role));

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex touch-target items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-brand"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function RoleSwitcher({ className }: { className?: string }) {
  const personas = useAppStore((s) => s.personas);
  const activePersonaId = useAppStore((s) => s.activePersonaId);
  const setPersona = useAppStore((s) => s.setPersona);
  const navigate = useNavigate();

  const ROLE_HOME: Record<string, string> = {
    system_admin: "/",
    school_admin: "/",
    teacher: "/classroom",
    student: "/tutor",
  };

  const handleChange = (id: string) => {
    setPersona(id);
    const persona = personas.find((p) => p.id === id);
    if (persona) {
      void navigate({ to: ROLE_HOME[persona.role] ?? "/" });
    }
  };

  return (
    <Select value={activePersonaId} onValueChange={handleChange}>
      <SelectTrigger className={cn("h-11 w-full bg-card text-left text-sm", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {personas.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ThemeToggle() {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle dark mode"
      className="touch-target shrink-0"
      onClick={toggleTheme}
    >
      {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const persona = useActivePersona();
  const school = useAppStore((s) => s.schools.find((x) => x.id === persona.schoolId));

  return (
    <div
      className="flex min-h-screen w-full bg-background"
      style={{ "--sidebar-offset": "0px" } as React.CSSProperties}
    >
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r bg-sidebar p-4 md:flex">
        <Brand />
        <div className="space-y-2">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Viewing as
          </p>
          <RoleSwitcher />
        </div>
        <NavLinks />
        <div className="mt-auto rounded-xl border bg-muted/60 p-3">
          <p className="truncate text-sm font-semibold">{persona.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {school ? school.name : "Scholaris HQ · All schools"}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b bg-card/95 px-3 py-2.5 backdrop-blur md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="touch-target" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[17rem] p-4">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-full flex-col gap-6">
                <Brand />
                <NavLinks onNavigate={() => setOpen(false)} />
                <div className="mt-auto rounded-xl border bg-muted/60 p-3">
                  <p className="truncate text-sm font-semibold">{persona.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {school ? school.name : "Scholaris HQ"}
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0">
            <RoleSwitcher className="h-10" />
          </div>
          <ThemeToggle />
        </header>

        <div className="hidden items-center justify-between gap-4 border-b bg-card/60 px-6 py-3 md:flex">
          <p className="truncate text-sm text-muted-foreground">
            {school ? `${school.name} · ${school.city}` : "All pilot schools · Lagos, Nigeria"}
          </p>
          <ThemeToggle />
        </div>

        <main className="min-w-0 flex-1 px-4 py-5 md:px-6 md:py-7">{children}</main>
      </div>
    </div>
  );
}
