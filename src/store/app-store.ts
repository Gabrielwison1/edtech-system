import { create } from "zustand";
import {
  CHAT_HISTORY,
  DIRECT_MESSAGES,
  DOCUMENTS,
  PERSONAS,
  QUIZZES,
  QUIZ_ATTEMPTS,
  SCHOOLS,
  STUDENTS,
  TEACHERS,
  type ChatMessage,
  type CourseDocument,
  type DirectMessage,
  type Persona,
  type Quiz,
  type QuizAttempt,
  type Student,
} from "@/lib/seed-data";
import { buildSocraticReply, generateQuestionsForTopics } from "@/lib/socratic";

const THEME_KEY = "scholaris_theme";

function getInitialTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  const stored = localStorage.getItem(THEME_KEY) as "light" | "dark" | null;
  const theme = stored ?? "light";
  document.documentElement.classList.toggle("dark", theme === "dark");
  return theme;
}

const uid = () => Math.random().toString(36).slice(2, 10);

interface AppState {
  personas: Persona[];
  activePersonaId: string;
  schools: typeof SCHOOLS;
  teachers: typeof TEACHERS;
  students: Student[];
  documents: CourseDocument[];
  chat: ChatMessage[];
  directMessages: DirectMessage[];
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  theme: "light" | "dark";

  setPersona: (id: string) => void;
  toggleTheme: () => void;
  setActivation: (studentId: string, value: boolean) => void;
  uploadDocument: (input: {
    title: string;
    subject: string;
    term: string;
    schoolId: string;
    teacherId: string;
  }) => string;
  advanceDocument: (id: string) => void;
  sendChatMessage: (studentId: string, text: string) => void;
  sendDirectMessage: (
    studentId: string,
    teacherId: string,
    text: string,
    from?: "student" | "teacher",
  ) => void;
  generateQuiz: (input: {
    schoolId: string;
    subject: string;
    topics: string[];
    createdBy: string;
  }) => Quiz;
  recordAttempt: (attempt: Omit<QuizAttempt, "id" | "takenAt">) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  personas: PERSONAS,
  activePersonaId: PERSONAS[0]!.id,
  schools: SCHOOLS,
  teachers: TEACHERS,
  students: STUDENTS,
  documents: DOCUMENTS,
  chat: CHAT_HISTORY,
  directMessages: DIRECT_MESSAGES,
  quizzes: QUIZZES,
  attempts: QUIZ_ATTEMPTS,
  theme: getInitialTheme(),

  setPersona: (id) => set({ activePersonaId: id }),

  toggleTheme: () =>
    set((s) => {
      const theme = s.theme === "light" ? "dark" : "light";
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", theme === "dark");
        localStorage.setItem(THEME_KEY, theme);
      }
      return { theme };
    }),

  setActivation: (studentId, value) =>
    set((s) => ({
      students: s.students.map((st) => (st.id === studentId ? { ...st, isActivated: value } : st)),
    })),

  uploadDocument: ({ title, subject, term, schoolId, teacherId }) => {
    const id = `doc_${uid()}`;
    set((s) => ({
      documents: [
        {
          id,
          schoolId,
          teacherId,
          title,
          subject,
          term,
          pages: 8 + Math.floor(Math.random() * 30),
          chunks: 20 + Math.floor(Math.random() * 90),
          status: "uploading",
          uploadedAt: new Date().toISOString(),
        },
        ...s.documents,
      ],
    }));
    return id;
  },

  advanceDocument: (id) =>
    set((s) => ({
      documents: s.documents.map((d) => {
        if (d.id !== id) return d;
        const next =
          d.status === "uploading" ? "chunking" : d.status === "chunking" ? "vectorizing" : "saved";
        return { ...d, status: next };
      }),
    })),

  sendChatMessage: (studentId, text) => {
    const state = get();
    const student = state.students.find((s) => s.id === studentId);
    const docs = state.documents.filter((d) => d.schoolId === (student?.schoolId ?? ""));
    const reply = buildSocraticReply(text, docs);
    const now = new Date().toISOString();

    set((s) => ({
      chat: [
        ...s.chat,
        { id: uid(), studentId, role: "student", content: text, createdAt: now },
        {
          id: uid(),
          studentId,
          role: "tutor",
          content: reply.content,
          citations: reply.citations,
          createdAt: now,
        },
      ],
      students: s.students.map((st) => {
        if (st.id !== studentId) return st;
        const existing = st.weaknesses.find((w) => w.topic === reply.topic);
        const weaknesses = existing
          ? st.weaknesses.map((w) =>
              w.topic === reply.topic ? { ...w, mastery: Math.min(100, w.mastery + 3) } : w,
            )
          : [...st.weaknesses, { topic: reply.topic, mastery: 50 }];
        return { ...st, weaknesses };
      }),
    }));
  },

  sendDirectMessage: (studentId, teacherId, text, from = "student") =>
    set((s) => ({
      directMessages: [
        ...s.directMessages,
        {
          id: uid(),
          studentId,
          teacherId,
          from,
          content: text,
          createdAt: new Date().toISOString(),
        },
      ],
    })),

  generateQuiz: ({ schoolId, subject, topics, createdBy }) => {
    const quiz: Quiz = {
      id: `quiz_${uid()}`,
      schoolId,
      subject,
      title: `Socratic Practice: ${topics.join(" & ")}`,
      topics,
      createdBy,
      createdAt: new Date().toISOString(),
      questions: generateQuestionsForTopics(topics),
    };
    set((s) => ({ quizzes: [quiz, ...s.quizzes] }));
    return quiz;
  },

  recordAttempt: (attempt) =>
    set((s) => {
      const pct = Math.round((attempt.score / Math.max(1, attempt.total)) * 100);
      return {
        attempts: [{ ...attempt, id: uid(), takenAt: new Date().toISOString() }, ...s.attempts],
        students: s.students.map((st) =>
          st.id === attempt.studentId
            ? {
                ...st,
                quizAverage: st.quizAverage === 0 ? pct : Math.round((st.quizAverage + pct) / 2),
                weaknesses: st.weaknesses.map((w) => ({
                  ...w,
                  mastery: Math.max(0, Math.min(100, Math.round((w.mastery + pct) / 2))),
                })),
              }
            : st,
        ),
      };
    }),
}));

export function useActivePersona() {
  return useAppStore((s) => s.personas.find((p) => p.id === s.activePersonaId) ?? s.personas[0]!);
}
