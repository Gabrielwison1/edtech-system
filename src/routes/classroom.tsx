import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { FileText, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { MasteryBar, PageHeader } from "@/components/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { sanitizeInput } from "@/lib/socratic";
import type { DocStatus, Student } from "@/lib/seed-data";
import { useActivePersona, useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/classroom")({
  head: () => ({
    meta: [
      { title: "Classroom — Scholaris" },
      {
        name: "description",
        content: "Upload course notes for the AI tutor and generate targeted practice quizzes.",
      },
      { property: "og:title", content: "Classroom — Scholaris" },
      {
        property: "og:description",
        content: "Teacher workspace for notes, class mastery and quiz generation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ClassroomPage,
});

const STATUS_PROGRESS: Record<DocStatus, number> = {
  uploading: 20,
  chunking: 50,
  vectorizing: 80,
  saved: 100,
};

const uploadSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  term: z.string().min(2, "Term is required").max(40),
});

// ─── Analytics Chart ────────────────────────────────────────────────────────

interface ChartEntry {
  name: string;
  mastery: number;
}

function WeaknessChart({ students }: { students: Student[] }) {
  // Aggregate average mastery per topic across all students
  const topicMap = new Map<string, { total: number; count: number }>();
  for (const s of students) {
    for (const w of s.weaknesses) {
      const existing = topicMap.get(w.topic);
      if (existing) {
        existing.total += w.mastery;
        existing.count += 1;
      } else {
        topicMap.set(w.topic, { total: w.mastery, count: 1 });
      }
    }
  }

  const data: ChartEntry[] = Array.from(topicMap.entries()).map(([name, { total, count }]) => ({
    name,
    mastery: Math.round(total / count),
  }));

  if (data.length === 0) return null;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-base">Class-wide topic mastery</CardTitle>
        <p className="text-xs text-muted-foreground">
          Average mastery score per topic across all students
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "0.5rem",
                fontSize: "12px",
              }}
              formatter={(value: number) => [`${value}%`, "Avg. Mastery"]}
            />
            <Bar dataKey="mastery" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={
                    entry.mastery < 50
                      ? "var(--color-warning)"
                      : entry.mastery < 70
                        ? "var(--color-primary)"
                        : "var(--color-action)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-warning" /> Below 50% —
            struggling
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" /> 50–70% — developing
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-action" /> Above 70% —
            proficient
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function ClassroomPage() {
  const persona = useActivePersona();
  const teachers = useAppStore((s) => s.teachers);
  const documents = useAppStore((s) => s.documents);
  const students = useAppStore((s) => s.students);
  const uploadDocument = useAppStore((s) => s.uploadDocument);
  const advanceDocument = useAppStore((s) => s.advanceDocument);
  const generateQuiz = useAppStore((s) => s.generateQuiz);

  const [title, setTitle] = useState("");
  const [term, setTerm] = useState("First Term");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const teacher = teachers.find((t) => t.id === persona.teacherId);
  if (persona.role !== "teacher" || !teacher) {
    return (
      <PageHeader title="Classroom" subtitle="Switch to a teacher persona to manage a classroom." />
    );
  }

  const myDocs = documents.filter((d) => d.teacherId === teacher.id);
  const myStudents = students.filter((s) => s.schoolId === teacher.schoolId);
  const weakTopics = Array.from(
    new Set(
      myStudents.flatMap((s) => s.weaknesses.filter((w) => w.mastery < 60).map((w) => w.topic)),
    ),
  );

  const handleFileDrop = (file: File) => {
    const allowed = ["application/pdf", "text/plain"];
    if (
      !allowed.includes(file.type) &&
      !file.name.endsWith(".pdf") &&
      !file.name.endsWith(".txt")
    ) {
      setError("Only PDF or plain text files are supported.");
      return;
    }
    setFileName(file.name);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    setError(null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileDrop(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileDrop(file);
  };

  const onUpload = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = uploadSchema.safeParse({
      title: sanitizeInput(title),
      term: sanitizeInput(term),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setError(null);
    const id = uploadDocument({
      ...parsed.data,
      subject: teacher.subject,
      schoolId: teacher.schoolId,
      teacherId: teacher.id,
    });
    toast.info("Uploading notes…");
    [900, 1800, 2700].forEach((ms, i) =>
      setTimeout(() => {
        advanceDocument(id);
        if (i === 2) toast.success(`"${parsed.data.title}" is ready for the AI tutor`);
      }, ms),
    );
    setTitle("");
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onGenerate = () => {
    const topics = weakTopics.slice(0, 2);
    if (topics.length === 0) return toast.info("No weak topics right now — great work!");
    const quiz = generateQuiz({
      schoolId: teacher.schoolId,
      subject: teacher.subject,
      topics,
      createdBy: teacher.name,
    });
    toast.success(`Quiz created: ${quiz.title}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classroom"
        subtitle={`${teacher.subject} · ${teacher.classes.join(", ")}`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Upload course notes</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onUpload} className="space-y-4">
              {/* Drag-and-drop dropzone */}
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload PDF or text file"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                }}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  dragging
                    ? "border-primary bg-primary-soft"
                    : "border-border hover:border-primary hover:bg-accent",
                )}
              >
                <Upload
                  className={cn("h-8 w-8", dragging ? "text-primary" : "text-muted-foreground")}
                />
                {fileName ? (
                  <span className="max-w-full truncate text-sm font-medium text-primary">
                    {fileName}
                  </span>
                ) : (
                  <>
                    <p className="text-sm font-medium">Drop a PDF or text file here</p>
                    <p className="text-xs text-muted-foreground">or click to browse</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,application/pdf,text/plain"
                className="sr-only"
                onChange={onFileChange}
                aria-hidden="true"
                tabIndex={-1}
              />

              <div className="space-y-1.5">
                <Label htmlFor="doc-title">Document title</Label>
                <Input
                  id="doc-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Week 4 — Linear Regression"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doc-term">Term</Label>
                <Input id="doc-term" value={term} onChange={(e) => setTerm(e.target.value)} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                className="touch-target w-full bg-action text-action-foreground hover:bg-action/90"
              >
                <Upload className="mr-2 h-4 w-4" /> Upload &amp; index
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Weakness card */}
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Topics needing attention</CardTitle>
            <Button
              size="sm"
              onClick={onGenerate}
              className="touch-target bg-action text-action-foreground hover:bg-action/90"
            >
              <Sparkles className="mr-1.5 h-4 w-4" /> Generate quiz
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {myStudents.map((s) => (
              <div key={s.id} className="rounded-lg border p-3">
                <p className="text-sm font-semibold">
                  {s.name}{" "}
                  <span className="font-normal text-muted-foreground">· {s.className}</span>
                </p>
                <div className="mt-2 space-y-1.5">
                  {s.weaknesses.map((w) => (
                    <div
                      key={w.topic}
                      className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] items-center gap-2 text-xs"
                    >
                      <span className="truncate">{w.topic}</span>
                      <MasteryBar value={w.mastery} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Analytics chart (F2) */}
      <WeaknessChart students={myStudents} />

      {/* Knowledge base */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Knowledge base ({myDocs.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {myDocs.map((d) => (
            <div key={d.id} className="flex items-start gap-3 rounded-lg border p-3">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{d.title}</p>
                  <Badge
                    variant={d.status === "saved" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {d.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {d.term} · {d.pages} pages · {d.chunks} chunks
                </p>
                {d.status !== "saved" && (
                  <Progress value={STATUS_PROGRESS[d.status]} className="mt-2 h-1.5" />
                )}
              </div>
            </div>
          ))}
          {myDocs.length === 0 && (
            <p className="text-sm text-muted-foreground">No documents yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
