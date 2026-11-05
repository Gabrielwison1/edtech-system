import type { Citation, CourseDocument, QuizQuestion } from "./seed-data";

/** Strips control characters and trims chat input before it reaches the tutor. */
export function sanitizeInput(raw: string): string {
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/<\/?[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 800);
}

const TOPIC_MAP: { match: RegExp; topic: string }[] = [
  { match: /quadratic|factoris|x²|roots|discriminant/i, topic: "Quadratic Equations" },
  { match: /gradient|learning rate|descent|loss/i, topic: "Gradient Descent" },
  { match: /neuron|neural|network|activation|layer/i, topic: "Neural Network Basics" },
  { match: /clean|missing value|outlier|dataset/i, topic: "Data Cleaning" },
  { match: /probabil|chance|likelihood/i, topic: "Probability" },
  { match: /python|loop|function|variable/i, topic: "Python Loops" },
];

export function detectTopic(question: string): string {
  return TOPIC_MAP.find((t) => t.match.test(question))?.topic ?? "General Study Skills";
}

const SOCRATIC_OPENERS = [
  "Let's work this out together rather than me handing you the answer.",
  "Great question. I'll guide you — you do the thinking.",
  "Hold on, before the answer: let's build it step by step.",
  "I can see what you're aiming at. Let's reason it through.",
];

const TOPIC_PROMPTS: Record<string, string[]> = {
  "Quadratic Equations": [
    "Look at your equation in the form ax² + bx + c. What are a, b and c here?",
    "Which two numbers multiply to give c and add to give b?",
    "If the brackets multiply to zero, what must be true about at least one bracket?",
  ],
  "Gradient Descent": [
    "The gradient points uphill on the loss surface — so which way should a step go?",
    "What would happen to your loss if each step were ten times bigger?",
    "How would you know, from the loss curve alone, that the learning rate is too small?",
  ],
  "Neural Network Basics": [
    "Think of a weighted class vote: whose opinion counts most, and why?",
    "What job does the activation function do after the weighted sum?",
    "Why would stacking two layers with no activation be the same as one layer?",
  ],
  "Data Cleaning": [
    "Before fixing anything: how would you spot which column is unreliable?",
    "Is dropping every row with a missing value always safe? What could you lose?",
  ],
  Probability: [
    "Start with the sample space: how many outcomes are possible in total?",
    "Which of those outcomes count as a 'success' for this question?",
  ],
  "Python Loops": [
    "What exactly is your loop counting over — items, or positions?",
    "What should the value be on the very first pass, and on the last?",
  ],
  "General Study Skills": [
    "Tell me the part you understand first, so we can find where it breaks down.",
    "Can you restate the question in your own words?",
  ],
};

export function buildSocraticReply(
  question: string,
  documents: CourseDocument[],
): { content: string; citations: Citation[]; topic: string } {
  const topic = detectTopic(question);
  const opener = SOCRATIC_OPENERS[question.length % SOCRATIC_OPENERS.length];
  const steps = TOPIC_PROMPTS[topic] ?? TOPIC_PROMPTS["General Study Skills"] ?? [];

  const relevant = documents.filter(
    (d) =>
      d.status === "saved" &&
      (topic.split(" ").some((w) => d.title.toLowerCase().includes(w.toLowerCase())) ||
        d.subject.toLowerCase().includes((topic.split(" ")[0] ?? "").toLowerCase())),
  );
  const source = relevant.length > 0 ? relevant : documents.filter((d) => d.status === "saved");

  const citations: Citation[] = source.slice(0, 2).map((doc, i) => ({
    documentId: doc.id,
    documentTitle: doc.title,
    chunk: `Chunk ${((question.length + i * 7) % doc.chunks) + 1} · p.${((i + 1) * 3) % doc.pages || 1}`,
    excerpt: `From your class notes on ${topic}: this section sets out the definitions and worked steps you need here.`,
  }));

  const content = [
    opener,
    "",
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    "",
    "Answer the first step and I'll take you to the next one.",
  ].join("\n");

  return { content, citations, topic };
}

const QUESTION_BANK: Record<string, QuizQuestion[]> = {
  "Quadratic Equations": [
    {
      id: "gq_qe_1",
      topic: "Quadratic Equations",
      prompt: "Factorise x² + 8x + 15.",
      options: ["(x + 3)(x + 5)", "(x + 15)(x + 1)", "(x − 3)(x − 5)", "(x + 2)(x + 6)"],
      correctIndex: 0,
      explanation: "3 × 5 = 15 and 3 + 5 = 8.",
    },
    {
      id: "gq_qe_2",
      topic: "Quadratic Equations",
      prompt: "For 2x² + 3x − 2 = 0, what is the value of the discriminant?",
      options: ["1", "17", "25", "−7"],
      correctIndex: 2,
      explanation: "b² − 4ac = 9 − 4(2)(−2) = 9 + 16 = 25.",
    },
  ],
  "Gradient Descent": [
    {
      id: "gq_gd_1",
      topic: "Gradient Descent",
      prompt: "A loss curve that zig-zags wildly usually signals what?",
      options: [
        "Too small a learning rate",
        "Too large a learning rate",
        "Too much data",
        "Too few features",
      ],
      correctIndex: 1,
      explanation: "Oversized steps overshoot the minimum on each update.",
    },
    {
      id: "gq_gd_2",
      topic: "Gradient Descent",
      prompt: "What is the role of the bias term in a linear model?",
      options: [
        "It shifts the prediction independently of the inputs",
        "It scales every input equally",
        "It removes outliers",
        "It sets the learning rate",
      ],
      correctIndex: 0,
      explanation: "The bias lets the fitted line move up or down without changing its slope.",
    },
  ],
  "Neural Network Basics": [
    {
      id: "gq_nn_1",
      topic: "Neural Network Basics",
      prompt: "Why do neural networks need non-linear activation functions?",
      options: [
        "To speed up training",
        "So stacked layers can model non-linear patterns",
        "To reduce the dataset size",
        "To guarantee zero loss",
      ],
      correctIndex: 1,
      explanation: "Without non-linearity, any stack of layers collapses into a single linear map.",
    },
  ],
  Probability: [
    {
      id: "gq_pr_1",
      topic: "Probability",
      prompt: "A fair die is rolled once. P(even number) = ?",
      options: ["1/6", "1/3", "1/2", "2/3"],
      correctIndex: 2,
      explanation: "Three of six outcomes (2, 4, 6) are even.",
    },
  ],
  "Data Cleaning": [
    {
      id: "gq_dc_1",
      topic: "Data Cleaning",
      prompt: "Which is the safest first response to a column with 40% missing values?",
      options: [
        "Delete the whole dataset",
        "Investigate why values are missing before deciding",
        "Fill every gap with zero",
        "Ignore it entirely",
      ],
      correctIndex: 1,
      explanation: "The reason data is missing decides whether imputing or dropping is valid.",
    },
  ],
  "Python Loops": [
    {
      id: "gq_pl_1",
      topic: "Python Loops",
      prompt: "How many times does `for i in range(1, 5)` run?",
      options: ["3", "4", "5", "6"],
      correctIndex: 1,
      explanation: "range(1, 5) yields 1, 2, 3, 4 — four iterations.",
    },
  ],
};

export function generateQuestionsForTopics(topics: string[]): QuizQuestion[] {
  const questions = topics.flatMap((t) => QUESTION_BANK[t] ?? []);
  if (questions.length > 0) {
    return questions.map((q, i) => ({ ...q, id: `${q.id}_${i}_${Date.now()}` }));
  }
  return (QUESTION_BANK["Quadratic Equations"] ?? []).map((q, i) => ({
    ...q,
    id: `${q.id}_${i}_${Date.now()}`,
  }));
}
