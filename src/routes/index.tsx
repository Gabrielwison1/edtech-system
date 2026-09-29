import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivationLocked, MasteryBar, PageHeader, StatCard } from "@/components/ui-kit";
import { useActivePersona, useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Scholaris" },
      {
        name: "description",
        content:
          "Role-aware dashboard for school admins, teachers and students across the Lagos pilot schools.",
      },
      { property: "og:title", content: "Dashboard — Scholaris" },
      {
        property: "og:description",
        content: "Activation status, class weakness analytics and AI tutoring at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const persona = useActivePersona();
  const { schools, students, documents, quizzes, attempts, teachers } = useAppStore();

  if (persona.role === "student") {
    const student = students.find((s) => s.id === persona.studentId)!;
    const school = schools.find((s) => s.id === student.schoolId)!;
    if (!student.isActivated) {
      return (
        <div className="py-6">
          <PageHeader title={`Welcome, ${student.name.split(" ")[0]}`} subtitle={school.name} />
          <ActivationLocked schoolName={school.name} />
        </div>
      );
    }
    const myAttempts = attempts.filter((a) => a.studentId === student.id);
    return (
      <div>
        <PageHeader
          title={`Welcome back, ${student.name.split(" ")[0]}`}
          subtitle={`${student.className} · ${school.name}`}
          action={
            <Button asChild className="bg-action text-action-foreground hover:bg-action/90">
              <Link to="/tutor">
                <Sparkles className="mr-2 h-4 w-4" /> Ask the tutor
              </Link>
            </Button>
          }
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Quiz average" value={`${student.quizAverage}%`} tone="action" />
          <StatCard label="Quizzes taken" value={myAttempts.length} />
          <StatCard
            label="Weak topics"
            value={student.weaknesses.filter((w) => w.mastery < 50).length}
            tone="warning"
          />
          <StatCard label="Class materials" value={documents.filter((d) => d.schoolId === school.id).length} />
        </div>

        <Card className="mt-5 shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Your topic mastery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {student.weaknesses.map((w) => (
              <div key={w.topic} className="space-y-1.5">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <p className="truncate text-sm font-medium">{w.topic}</p>
                  {w.mastery < 50 && (
                    <Badge className="shrink-0 border-0 bg-warning-soft text-warning-foreground">
                      Struggling
                    </Badge>
                  )}
                </div>
                <MasteryBar value={w.mastery} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (persona.role === "teacher") {
    const teacher = teachers.find((t) => t.id === persona.teacherId)!;
    const classStudents = students.filter((s) => s.schoolId === teacher.schoolId);
    const struggling = classStudents.filter((s) =>
      s.weaknesses.some((w) => w.mastery < 50),
    ).length;
    return (
      <div>
        <PageHeader
          title={`Good day, ${teacher.name}`}
          subtitle={`${teacher.subject} · ${teacher.classes.join(", ")}`}
          action={
            <Button asChild>
              <Link to="/classroom">
                Open classroom <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Students" value={classStudents.length} />
          <StatCard label="Struggling" value={struggling} tone="warning" hint="Mastery below 50%" />
          <StatCard
            label="Materials ingested"
            value={documents.filter((d) => d.teacherId === teacher.id).length}
            tone="action"
          />
          <StatCard label="Quizzes generated" value={quizzes.filter((q) => q.createdBy === teacher.id).length} />
        </div>
        <Card className="mt-5 shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Students needing attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {classStudents.map((s) => (
              <div key={s.id} className="space-y-1.5">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <p className="truncate text-sm font-medium">
                    {s.name} <span className="text-muted-foreground">· {s.className}</span>
                  </p>
                  <Badge
                    className={
                      s.isActivated
                        ? "shrink-0 border-0 bg-action-soft text-action"
                        : "shrink-0 border-0 bg-destructive-soft text-destructive"
                    }
                  >
                    {s.isActivated ? "Active" : "Pending fee"}
                  </Badge>
                </div>
                <MasteryBar
                  value={Math.round(
                    s.weaknesses.reduce((a, w) => a + w.mastery, 0) / Math.max(1, s.weaknesses.length),
                  )}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const scopedSchools =
    persona.role === "school_admin" ? schools.filter((s) => s.id === persona.schoolId) : schools;
  const scopedStudents = students.filter((s) => scopedSchools.some((sc) => sc.id === s.schoolId));
  const activated = scopedStudents.filter((s) => s.isActivated).length;
  const revenue = scopedStudents
    .filter((s) => s.isActivated)
    .reduce((sum, s) => sum + (schools.find((sc) => sc.id === s.schoolId)?.activationFee ?? 0), 0);

  return (
    <div>
      <PageHeader
        title={persona.role === "system_admin" ? "Pilot overview" : "School overview"}
        subtitle={
          persona.role === "system_admin"
            ? "All Lagos pilot schools"
            : scopedSchools[0]?.name ?? "School"
        }
        action={
          <Button asChild>
            <Link to="/schools">
              <Users className="mr-2 h-4 w-4" /> Manage activation
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Schools" value={scopedSchools.length} />
        <StatCard label="Students enrolled" value={scopedStudents.length} />
        <StatCard
          label="Activated"
          value={`${activated}/${scopedStudents.length}`}
          tone="action"
          hint="Activation fee recorded"
        />
        <StatCard
          label="Fees collected"
          value={`₦${revenue.toLocaleString()}`}
          tone={activated === scopedStudents.length ? "action" : "warning"}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {scopedSchools.map((school) => {
          const roster = students.filter((s) => s.schoolId === school.id);
          const pending = roster.filter((s) => !s.isActivated).length;
          return (
            <Card key={school.id} className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base">{school.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {school.city} · {school.plan}
                </p>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Students</p>
                  <p className="font-semibold">{roster.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className={pending ? "font-semibold text-destructive" : "font-semibold text-action"}>
                    {pending}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fee</p>
                  <p className="font-semibold">₦{school.activationFee.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
