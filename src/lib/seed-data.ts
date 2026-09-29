export type Role = "system_admin" | "school_admin" | "teacher" | "student";

export interface School {
  id: string;
  name: string;
  city: string;
  plan: string;
  activationFee: number;
}

export interface Persona {
  id: string;
  label: string;
  shortLabel: string;
  role: Role;
  name: string;
  schoolId: string | null;
  studentId?: string;
  teacherId?: string;
}

export interface Student {
  id: string;
  schoolId: string;
  name: string;
  className: string;
  isActivated: boolean;
  guardianPhone: string;
  quizAverage: number;
  weaknesses: { topic: string; mastery: number }[];
}

export interface Teacher {
  id: string;
  schoolId: string;
  name: string;
  subject: string;
  classes: string[];
}

export type DocStatus = "uploading" | "chunking" | "vectorizing" | "saved";

export interface CourseDocument {
  id: string;
  schoolId: string;
  teacherId: string;
  title: string;
  subject: string;
  term: string;
  pages: number;
  chunks: number;
  status: DocStatus;
  uploadedAt: string;
}

export interface Citation {
  documentId: string;
  documentTitle: string;
  chunk: string;
  excerpt: string;
}

export interface ChatMessage {
  id: string;
  studentId: string;
  role: "student" | "tutor";
  content: string;
  citations?: Citation[];
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  studentId: string;
  teacherId: string;
  from: "student" | "teacher";
  content: string;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  topic: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  schoolId: string;
  subject: string;
  title: string;
  topics: string[];
  createdBy: string;
  createdAt: string;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  score: number;
  total: number;
  takenAt: string;
}

export const SCHOOLS: School[] = [
  {
    id: "sch_lagos_city",
    name: "Lagos City College",
    city: "Yaba, Lagos",
    plan: "Pilot — Term 1",
    activationFee: 7500,
  },
  {
    id: "sch_atlantic",
    name: "Atlantic High School",
    city: "Lekki, Lagos",
    plan: "Pilot — Term 1",
    activationFee: 9000,
  },
];

export const TEACHERS: Teacher[] = [
  {
    id: "tch_joshua",
    schoolId: "sch_atlantic",
    name: "Mr. Joshua Adeyemi",
    subject: "Data Science & AI Engineering",
    classes: ["SS2 Alpha", "SS3 Beta"],
  },
  {
    id: "tch_ngozi",
    schoolId: "sch_lagos_city",
    name: "Mrs. Ngozi Eze",
    subject: "Further Mathematics",
    classes: ["SS2 Gold"],
  },
];

export const STUDENTS: Student[] = [
  {
    id: "std_chidi",
    schoolId: "sch_atlantic",
    name: "Chidi Okonkwo",
    className: "SS2 Alpha",
    isActivated: true,
    guardianPhone: "+234 803 114 2290",
    quizAverage: 74,
    weaknesses: [
      { topic: "Quadratic Equations", mastery: 38 },
      { topic: "Gradient Descent", mastery: 52 },
      { topic: "Data Cleaning", mastery: 81 },
    ],
  },
  {
    id: "std_amina",
    schoolId: "sch_atlantic",
    name: "Amina Bello",
    className: "SS2 Alpha",
    isActivated: false,
    guardianPhone: "+234 810 552 7714",
    quizAverage: 0,
    weaknesses: [
      { topic: "Quadratic Equations", mastery: 44 },
      { topic: "Probability", mastery: 47 },
    ],
  },
  {
    id: "std_tunde",
    schoolId: "sch_lagos_city",
    name: "Tunde Balogun",
    className: "SS2 Gold",
    isActivated: true,
    guardianPhone: "+234 706 330 8812",
    quizAverage: 61,
    weaknesses: [
      { topic: "Neural Network Basics", mastery: 49 },
      { topic: "Python Loops", mastery: 88 },
    ],
  },
];

export const DOCUMENTS: CourseDocument[] = [
  {
    id: "doc_intro_ds",
    schoolId: "sch_atlantic",
    teacherId: "tch_joshua",
    title: "Introduction to Data Science & AI Engineering.pdf",
    subject: "Data Science & AI Engineering",
    term: "First Term",
    pages: 42,
    chunks: 128,
    status: "saved",
    uploadedAt: "2026-09-08T09:20:00.000Z",
  },
  {
    id: "doc_regression",
    schoolId: "sch_atlantic",
    teacherId: "tch_joshua",
    title: "Linear Regression & Gradient Descent Notes.pdf",
    subject: "Data Science & AI Engineering",
    term: "First Term",
    pages: 18,
    chunks: 57,
    status: "saved",
    uploadedAt: "2026-09-15T14:05:00.000Z",
  },
  {
    id: "doc_quadratics",
    schoolId: "sch_atlantic",
    teacherId: "tch_joshua",
    title: "Quadratic Equations for Model Maths.pdf",
    subject: "Further Mathematics",
    term: "First Term",
    pages: 12,
    chunks: 33,
    status: "saved",
    uploadedAt: "2026-09-21T08:40:00.000Z",
  },
  {
    id: "doc_python",
    schoolId: "sch_lagos_city",
    teacherId: "tch_ngozi",
    title: "Python Foundations Workbook.pdf",
    subject: "Further Mathematics",
    term: "First Term",
    pages: 26,
    chunks: 71,
    status: "saved",
    uploadedAt: "2026-09-12T11:00:00.000Z",
  },
];

export const CHAT_HISTORY: ChatMessage[] = [
  {
    id: "msg_1",
    studentId: "std_chidi",
    role: "student",
    content: "Sir, how do I solve x² + 5x + 6 = 0?",
    createdAt: "2026-09-26T16:02:00.000Z",
  },
  {
    id: "msg_2",
    studentId: "std_chidi",
    role: "tutor",
    content:
      "Good question — let's reason it out together. A quadratic in the form x² + bx + c often factorises. What two numbers multiply to give 6 and add up to 5? Write them down before we continue.",
    citations: [
      {
        documentId: "doc_quadratics",
        documentTitle: "Quadratic Equations for Model Maths.pdf",
        chunk: "Chunk 7 · p.3",
        excerpt:
          "To factorise x² + bx + c, look for a pair of numbers whose product is c and whose sum is b.",
      },
    ],
    createdAt: "2026-09-26T16:02:30.000Z",
  },
  {
    id: "msg_3",
    studentId: "std_chidi",
    role: "student",
    content: "2 and 3?",
    createdAt: "2026-09-26T16:03:10.000Z",
  },
  {
    id: "msg_4",
    studentId: "std_chidi",
    role: "tutor",
    content:
      "Exactly — 2 × 3 = 6 and 2 + 3 = 5. Now, how would you rewrite the equation using those two numbers as brackets? Try it and tell me what you get.",
    citations: [
      {
        documentId: "doc_quadratics",
        documentTitle: "Quadratic Equations for Model Maths.pdf",
        chunk: "Chunk 8 · p.4",
        excerpt: "x² + 5x + 6 = (x + 2)(x + 3); each bracket is then set equal to zero.",
      },
    ],
    createdAt: "2026-09-26T16:03:40.000Z",
  },
  {
    id: "msg_5",
    studentId: "std_tunde",
    role: "student",
    content: "What is a neuron in a neural network?",
    createdAt: "2026-09-25T10:14:00.000Z",
  },
  {
    id: "msg_6",
    studentId: "std_tunde",
    role: "tutor",
    content:
      "Before I answer, think of something you already know: a classroom vote. Each classmate's opinion carries a different weight with you. How might that idea of 'weighted opinions' describe what a neuron does with its inputs?",
    citations: [
      {
        documentId: "doc_intro_ds",
        documentTitle: "Introduction to Data Science & AI Engineering.pdf",
        chunk: "Chunk 41 · p.19",
        excerpt:
          "A neuron computes a weighted sum of its inputs, adds a bias and passes the result through an activation function.",
      },
    ],
    createdAt: "2026-09-25T10:14:25.000Z",
  },
];

export const DIRECT_MESSAGES: DirectMessage[] = [
  {
    id: "dm_1",
    studentId: "std_chidi",
    teacherId: "tch_joshua",
    from: "student",
    content: "Good afternoon sir. Will the gradient descent topic be in next week's test?",
    createdAt: "2026-09-27T13:30:00.000Z",
  },
  {
    id: "dm_2",
    studentId: "std_chidi",
    teacherId: "tch_joshua",
    from: "teacher",
    content:
      "Yes Chidi. Revise the learning-rate section of the notes, and attempt the practice quiz I generated.",
    createdAt: "2026-09-27T14:02:00.000Z",
  },
];

export const QUIZZES: Quiz[] = [
  {
    id: "quiz_quadratics",
    schoolId: "sch_atlantic",
    subject: "Further Mathematics",
    title: "Socratic Practice: Quadratic Equations",
    topics: ["Quadratic Equations"],
    createdBy: "tch_joshua",
    createdAt: "2026-09-24T09:00:00.000Z",
    questions: [
      {
        id: "q1",
        topic: "Quadratic Equations",
        prompt: "Which factorisation is correct for x² + 7x + 12 = 0?",
        options: ["(x + 3)(x + 4)", "(x + 2)(x + 6)", "(x - 3)(x - 4)", "(x + 12)(x + 1)"],
        correctIndex: 0,
        explanation: "3 × 4 = 12 and 3 + 4 = 7, so the brackets are (x + 3)(x + 4).",
      },
      {
        id: "q2",
        topic: "Quadratic Equations",
        prompt: "What does the discriminant b² − 4ac tell you?",
        options: [
          "The turning point of the curve",
          "The number and nature of the roots",
          "The y-intercept",
          "The gradient at x = 0",
        ],
        correctIndex: 1,
        explanation:
          "A positive discriminant gives two real roots, zero gives one repeated root, negative gives no real roots.",
      },
      {
        id: "q3",
        topic: "Quadratic Equations",
        prompt: "Solve: x² − 9 = 0",
        options: ["x = 9 only", "x = 3 only", "x = 3 or x = −3", "No real solution"],
        correctIndex: 2,
        explanation: "This is a difference of two squares: (x − 3)(x + 3) = 0.",
      },
    ],
  },
  {
    id: "quiz_gradient",
    schoolId: "sch_atlantic",
    subject: "Data Science & AI Engineering",
    title: "Socratic Practice: Gradient Descent",
    topics: ["Gradient Descent"],
    createdBy: "tch_joshua",
    createdAt: "2026-09-26T09:00:00.000Z",
    questions: [
      {
        id: "q1",
        topic: "Gradient Descent",
        prompt: "What happens if the learning rate is far too large?",
        options: [
          "Training becomes very slow but stable",
          "The loss may oscillate or diverge",
          "The model memorises the data",
          "Nothing changes",
        ],
        correctIndex: 1,
        explanation: "Large steps overshoot the minimum, so the loss bounces around or blows up.",
      },
      {
        id: "q2",
        topic: "Gradient Descent",
        prompt: "Gradient descent updates weights in which direction?",
        options: [
          "The direction of the gradient",
          "The opposite of the gradient",
          "A random direction",
          "Always towards zero",
        ],
        correctIndex: 1,
        explanation: "We move against the gradient because the gradient points uphill on the loss surface.",
      },
    ],
  },
];

export const QUIZ_ATTEMPTS: QuizAttempt[] = [
  {
    id: "att_1",
    quizId: "quiz_quadratics",
    studentId: "std_chidi",
    score: 2,
    total: 3,
    takenAt: "2026-09-25T17:10:00.000Z",
  },
  {
    id: "att_2",
    quizId: "quiz_gradient",
    studentId: "std_tunde",
    score: 1,
    total: 2,
    takenAt: "2026-09-26T18:22:00.000Z",
  },
];

export const PERSONAS: Persona[] = [
  {
    id: "p_sys",
    label: "System Admin — Scholaris HQ",
    shortLabel: "System Admin",
    role: "system_admin",
    name: "Oluebube U.",
    schoolId: null,
  },
  {
    id: "p_school_admin",
    label: "School Admin — Atlantic High",
    shortLabel: "School Admin",
    role: "school_admin",
    name: "Mrs. Folake Ade",
    schoolId: "sch_atlantic",
  },
  {
    id: "p_teacher",
    label: "Teacher — Mr. Joshua",
    shortLabel: "Teacher",
    role: "teacher",
    name: "Mr. Joshua Adeyemi",
    schoolId: "sch_atlantic",
    teacherId: "tch_joshua",
  },
  {
    id: "p_student_chidi",
    label: "Student — Chidi (Activated)",
    shortLabel: "Student · Chidi",
    role: "student",
    name: "Chidi Okonkwo",
    schoolId: "sch_atlantic",
    studentId: "std_chidi",
  },
  {
    id: "p_student_amina",
    label: "Student — Amina (Pending Activation)",
    shortLabel: "Student · Amina",
    role: "student",
    name: "Amina Bello",
    schoolId: "sch_atlantic",
    studentId: "std_amina",
  },
];
