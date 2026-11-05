import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { ActivationLocked, PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { sanitizeInput } from "@/lib/socratic";
import { cn } from "@/lib/utils";
import { useActivePersona, useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Escalations — Scholaris" },
      { name: "description", content: "Private messaging between students and their teachers." },
      { property: "og:title", content: "Escalations — Scholaris" },
      {
        property: "og:description",
        content: "Ask your teacher directly when the AI tutor isn't enough.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const persona = useActivePersona();
  const students = useAppStore((s) => s.students);
  const teachers = useAppStore((s) => s.teachers);
  const schools = useAppStore((s) => s.schools);
  const dms = useAppStore((s) => s.directMessages);
  const send = useAppStore((s) => s.sendDirectMessage);
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const isStudent = persona.role === "student";
  const me = isStudent
    ? students.find((s) => s.id === persona.studentId)
    : teachers.find((t) => t.id === persona.teacherId);
  if (!me || (persona.role !== "student" && persona.role !== "teacher")) {
    return (
      <PageHeader
        title={isStudent ? "Escalate to Teacher" : "Student Escalations"}
        subtitle="Switch to a student or teacher persona to message."
      />
    );
  }
  if (isStudent && "isActivated" in me && !me.isActivated) {
    return (
      <ActivationLocked
        schoolName={schools.find((s) => s.id === me.schoolId)?.name ?? "your school"}
      />
    );
  }

  const contacts = isStudent
    ? teachers
        .filter((t) => t.schoolId === me.schoolId)
        .map((t) => ({ id: t.id, name: t.name, sub: t.subject }))
    : students
        .filter((s) => s.schoolId === me.schoolId)
        .map((s) => ({ id: s.id, name: s.name, sub: s.className }));
  const current = selected ?? contacts[0]?.id ?? null;
  const thread = dms.filter((m) =>
    isStudent
      ? m.studentId === me.id && m.teacherId === current
      : m.teacherId === me.id && m.studentId === current,
  );
  const myRole = isStudent ? "student" : "teacher";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.length, current]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeInput(text);
    if (!clean || !current) return;
    if (isStudent) send(me.id, current, clean, "student");
    else send(current, me.id, clean, "teacher");
    setText("");
    toast.success("Message sent");
  };

  return (
    <div>
      <PageHeader
        title={isStudent ? "Escalate to Teacher" : "Student Escalations"}
        subtitle={isStudent ? "Message your teachers directly." : "Reply to your students."}
      />
      <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
        <div className="flex gap-2 overflow-x-auto md:flex-col">
          {contacts.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={cn(
                "touch-target shrink-0 rounded-lg border px-3 py-2 text-left text-sm",
                current === c.id ? "border-primary bg-primary/10" : "bg-card",
              )}
            >
              <p className="font-semibold">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.sub}</p>
            </button>
          ))}
        </div>
        <Card className="shadow-card">
          <CardContent className="flex min-h-[420px] flex-col p-4">
            <div className="flex-1 space-y-3">
              {thread.map((m) => (
                <div
                  key={m.id}
                  className={cn("flex", m.from === myRole ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                      m.from === myRole ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}
                  >
                    {m.content}
                    <p className="mt-1 text-[10px] opacity-70">
                      {new Date(m.createdAt).toLocaleString("en-NG", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {thread.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  No messages yet. Say hello!
                </p>
              )}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={submit} className="safe-bottom mt-4 flex items-end gap-2 border-t pt-3">
              <Textarea
                value={text}
                maxLength={800}
                rows={1}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a message…"
                className="min-h-11 resize-none text-base"
              />
              <Button
                type="submit"
                size="icon"
                className="touch-target shrink-0 bg-action text-action-foreground hover:bg-action/90"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
