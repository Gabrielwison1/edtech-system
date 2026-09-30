import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { ActivationLocked, PageHeader } from "@/components/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Quiz } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useActivePersona, useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "Practice Quizzes — Scholaris" },
      { name: "description", content: "Targeted practice quizzes built from your weakest topics." },
      { property: "og:title", content: "Practice Quizzes — Scholaris" },
      { property: "og:description", content: "Take quizzes, see explanations and track your mastery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PracticePage,
});

function PracticePage() {
  const persona = useActivePersona();
  const students = useAppStore((s) => s.students);
  const schools = useAppStore((s) => s.schools);
  const quizzes = useAppStore((s) => s.quizzes);
  const attempts = useAppStore((s) => s.attempts);
  const [active, setActive] = useState<Quiz | null>(null);

  const schoolId = persona.schoolId;
  const visible = schoolId ? quizzes.filter((q) => q.schoolId === schoolId) : quizzes;
  const student = students.find((s) => s.id === persona.studentId);

  if (persona.role === "student" && student && !student.isActivated) {
    return <ActivationLocked schoolName={schools.find((s) => s.id === student.schoolId)?.name ?? "your school"} />;
  }
  if (active && student) return <QuizRunner quiz={active} studentId={student.id} onDone={() => setActive(null)} />;

  return (
    <div>
      <PageHeader title="Practice Quizzes" subtitle="Short, targeted quizzes on the topics that matter most." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((q) => {
          const mine = attempts.filter((a) => a.quizId === q.id && a.studentId === student?.id);
          const best = mine.reduce((m, a) => Math.max(m, Math.round((a.score / a.total) * 100)), -1);
          const taken = attempts.filter((a) => a.quizId === q.id).length;
          return (
            <Card key={q.id} className="flex flex-col shadow-card">
              <CardHeader>
                <CardTitle className="text-base">{q.title}</CardTitle>
                <p className="text-xs text-muted-foreground">{q.subject} · {q.questions.length} questions · by {q.createdBy}</p>
              </CardHeader>
              <CardContent className="mt-auto space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {q.topics.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
                </div>
                {student ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("text-sm font-semibold", best < 0 ? "text-muted-foreground" : best < 50 ? "text-warning" : "text-action")}>
                      {best < 0 ? "Not attempted" : `Best: ${best}%`}
                    </span>
                    <Button className="touch-target bg-action text-action-foreground hover:bg-action/90" onClick={() => setActive(q)}>
                      {best < 0 ? "Start" : "Retake"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{taken} attempt(s) recorded</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      {visible.length === 0 && <p className="text-sm text-muted-foreground">No quizzes yet.</p>}
    </div>
  );
}

function QuizRunner({ quiz, studentId, onDone }: { quiz: Quiz; studentId: string; onDone: () => void }) {
  const recordAttempt = useAppStore((s) => s.recordAttempt);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const score = quiz.questions.filter((q) => answers[q.id] === q.correctIndex).length;
  const complete = Object.keys(answers).length === quiz.questions.length;

  const submit = () => {
    setSubmitted(true);
    recordAttempt({ quizId: quiz.id, studentId, score, total: quiz.questions.length });
    const pct = Math.round((score / quiz.questions.length) * 100);
    toast[pct >= 50 ? "success" : "warning"](`You scored ${score}/${quiz.questions.length} (${pct}%)`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-8">
      <PageHeader title={quiz.title} subtitle={submitted ? `Score: ${score}/${quiz.questions.length}` : "Choose one answer per question."} action={<Button variant="outline" onClick={onDone}>Back</Button>} />
      {quiz.questions.map((q, qi) => (
        <Card key={q.id} className="shadow-card">
          <CardContent className="space-y-3 p-4">
            <p className="font-medium">{qi + 1}. {q.prompt}</p>
            <div className="grid gap-2">
              {q.options.map((opt, oi) => {
                const picked = answers[q.id] === oi;
                const correct = submitted && oi === q.correctIndex;
                const wrong = submitted && picked && oi !== q.correctIndex;
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={submitted}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                    className={cn(
                      "touch-target flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      picked && !submitted && "border-primary bg-primary/10",
                      correct && "border-action bg-action-soft",
                      wrong && "border-destructive bg-destructive-soft",
                    )}
                  >
                    {opt}
                    {correct && <CheckCircle2 className="h-4 w-4 text-action" />}
                    {wrong && <XCircle className="h-4 w-4 text-destructive" />}
                  </button>
                );
              })}
            </div>
            {submitted && <p className="text-xs text-muted-foreground">{q.explanation}</p>}
          </CardContent>
        </Card>
      ))}
      {submitted ? (
        <Button className="touch-target w-full" onClick={onDone}>Back to quizzes</Button>
      ) : (
        <Button disabled={!complete} className="touch-target w-full bg-action text-action-foreground hover:bg-action/90" onClick={submit}>
          Submit answers
        </Button>
      )}
    </div>
  );
}
