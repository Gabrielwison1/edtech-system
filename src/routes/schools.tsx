import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader, StatCard } from "@/components/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useActivePersona, useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/schools")({
  head: () => ({
    meta: [
      { title: "Schools & Activation — Scholaris" },
      {
        name: "description",
        content: "Manage pilot schools and student activation fees across Lagos.",
      },
      { property: "og:title", content: "Schools & Activation — Scholaris" },
      { property: "og:description", content: "Track paid and unpaid activation fees per student." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SchoolsPage,
});

const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

function SchoolsPage() {
  const persona = useActivePersona();
  const schools = useAppStore((s) => s.schools);
  const allStudents = useAppStore((s) => s.students);
  const setActivation = useAppStore((s) => s.setActivation);
  const [q, setQ] = useState("");

  if (persona.role === "student" || persona.role === "teacher") {
    return (
      <PageHeader
        title="Schools & Activation"
        subtitle="Only administrators can manage activation."
      />
    );
  }

  const visibleSchools =
    persona.role === "school_admin" ? schools.filter((s) => s.id === persona.schoolId) : schools;
  const students = allStudents.filter(
    (st) =>
      visibleSchools.some((s) => s.id === st.schoolId) &&
      st.name.toLowerCase().includes(q.toLowerCase()),
  );
  const paid = students.filter((s) => s.isActivated).length;
  const revenue = students
    .filter((s) => s.isActivated)
    .reduce((sum, st) => sum + (schools.find((s) => s.id === st.schoolId)?.activationFee ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Schools & Activation"
        subtitle={
          persona.role === "system_admin" ? "All pilot schools in Lagos" : (visibleSchools[0]?.name ?? "")
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Schools" value={visibleSchools.length} />
        <StatCard label="Activated" value={paid} tone="action" />
        <StatCard label="Unpaid" value={students.length - paid} tone="danger" />
        <StatCard label="Fees collected" value={naira(revenue)} />
      </div>

      <Card className="shadow-card">
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Students</CardTitle>
          <Input
            placeholder="Search students…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="sm:max-w-xs"
          />
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile: stacked cards */}
          <ul className="divide-y sm:hidden">
            {students.map((st) => {
              const school = schools.find((s) => s.id === st.schoolId);
              return (
                <li key={st.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{st.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {st.className} · {school?.name}
                    </p>
                    <FeeBadge paid={st.isActivated} fee={school?.activationFee ?? 0} />
                  </div>
                  <ActivationSwitch
                    checked={st.isActivated}
                    onChange={(v) => {
                      setActivation(st.id, v);
                      toast.success(v ? `${st.name} activated` : `${st.name} deactivated`);
                    }}
                  />
                </li>
              );
            })}
          </ul>
          {/* Desktop: table */}
          <table className="hidden w-full text-sm sm:table">
            <thead className="border-y bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Student</th>
                <th className="p-3">Class</th>
                <th className="p-3">School</th>
                <th className="p-3">Guardian</th>
                <th className="p-3">Fee</th>
                <th className="p-3 text-right">Activated</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((st) => {
                const school = schools.find((s) => s.id === st.schoolId);
                return (
                  <tr key={st.id}>
                    <td className="p-3 font-medium">{st.name}</td>
                    <td className="p-3">{st.className}</td>
                    <td className="p-3">{school?.name}</td>
                    <td className="p-3 tabular-nums">{st.guardianPhone}</td>
                    <td className="p-3">
                      <FeeBadge paid={st.isActivated} fee={school?.activationFee ?? 0} />
                    </td>
                    <td className="p-3 text-right">
                      <ActivationSwitch
                        checked={st.isActivated}
                        onChange={(v) => {
                          setActivation(st.id, v);
                          toast.success(v ? `${st.name} activated` : `${st.name} deactivated`);
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {students.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">No students found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FeeBadge({ paid, fee }: { paid: boolean; fee: number }) {
  return paid ? (
    <Badge className="mt-1 bg-action text-action-foreground hover:bg-action">
      Paid {naira(fee)}
    </Badge>
  ) : (
    <Badge variant="destructive" className="mt-1">
      Unpaid {naira(fee)}
    </Badge>
  );
}

function ActivationSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <span className="touch-target inline-flex items-center justify-center">
      <Switch checked={checked} onCheckedChange={onChange} aria-label="Toggle activation" />
    </span>
  );
}
