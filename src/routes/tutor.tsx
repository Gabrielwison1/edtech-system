import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BookOpen, Send } from "lucide-react";

import { ActivationLocked, PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sanitizeInput } from "@/lib/socratic";
import { cn } from "@/lib/utils";
import { useActivePersona, useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/tutor")({
  head: () => ({
    meta: [
      { title: "AI Tutor — Scholaris" },
      { name: "description", content: "A Socratic AI tutor grounded in your teacher's own course notes." },
      { property: "og:title", content: "AI Tutor — Scholaris" },
      { property: "og:description", content: "Ask questions and get guided, cited, step-by-step hints." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TutorPage,
});

function TutorPage() {
  const persona = useActivePersona();
  const students = useAppStore((s) => s.students);
  const schools = useAppStore((s) => s.schools);
  const allChat = useAppStore((s) => s.chat);
  const send = useAppStore((s) => s.sendChatMessage);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const student = students.find((s) => s.id === persona.studentId);
  const chat = allChat.filter((m) => m.studentId === student?.id);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.length]);

  if (persona.role !== "student" || !student) {
    return <PageHeader title="AI Tutor" subtitle="Switch to a student persona to chat with the tutor." />;
  }
  if (!student.isActivated) {
    return <ActivationLocked schoolName={schools.find((s) => s.id === student.schoolId)?.name ?? "your school"} />;
  }

  const submit = () => {
    const clean = sanitizeInput(text);
    if (!clean) return;
    send(student.id, clean);
    setText("");
  };

  return (
    <div className="pb-40">
      <PageHeader title="AI Tutor" subtitle="I guide you with questions — I won't just hand you the answer." />
      <div className="space-y-4">
        {chat.map((m) => (
          <div key={m.id} className={cn("flex", m.role === "student" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-card",
                m.role === "student" ? "bg-primary text-primary-foreground" : "border bg-card",
              )}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t pt-2">
                  {m.citations.map((c, i) => (
                    <p key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                      <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-action" />
                      <span><span className="font-semibold">{c.documentTitle}</span> · {c.chunk} — “{c.excerpt}”</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur md:left-64">
        <form
          className="mx-auto flex max-w-3xl items-end gap-2 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Textarea
            value={text}
            maxLength={800}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask about any topic from your notes…"
            rows={1}
            className="max-h-32 min-h-11 resize-none text-base"
          />
          <Button type="submit" size="icon" className="touch-target shrink-0 bg-action text-action-foreground hover:bg-action/90" aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
