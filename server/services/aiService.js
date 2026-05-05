const axios = require('axios');
const config = require('../config/env');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';
const TOPICS = [
  'Arrays',
  'Strings',
  'Linked Lists',
  'Trees',
  'Graphs',
  'Dynamic Programming',
  'Sorting',
  'Searching',
  'Probability',
  'Logical Reasoning',
  'Quantitative Aptitude',
  'Verbal Ability',
];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

function ensureGroqKey() {
  if (!config.groq.apiKey) {
    throw new Error('Groq API key not configured');
  }
}

function extractJson(text) {
  if (!text) return '';

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const payload = fenced ? fenced[1] : text;

  const arrayIndex = payload.indexOf('[');
  const objectIndex = payload.indexOf('{');
  const start = [arrayIndex, objectIndex].filter(i => i >= 0).sort((a, b) => a - b)[0];

  if (start === undefined) return payload.trim();

  const endChar = payload[start] === '[' ? ']' : '}';
  const end = payload.lastIndexOf(endChar);
  if (end > start) {
    return payload.slice(start, end + 1).trim();
  }

  return payload.slice(start).trim();
}

async function groqChatJson(prompt) {
  ensureGroqKey();

  const response = await axios.post(
    GROQ_API_URL,
    {
      model: GROQ_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that returns only valid JSON with no extra text.',
        },
        { role: 'user', content: prompt },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${config.groq.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  const text = response.data?.choices?.[0]?.message?.content || '';
  const jsonText = extractJson(text);
  return JSON.parse(jsonText);
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Generate aptitude (MCQ) questions using Groq
 */
async function generateMCQQuestions(topic, difficulty, count = 3) {
  const prompt = `Generate ${count} unique ${difficulty} difficulty multiple choice questions for placement preparation on the topic "${topic}".

Return a JSON array of objects with this exact shape:
[
  {
    "question": "string",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "string (must match one option)",
    "explanation": "string"
  }
]

Rules:
- Exactly 4 options per question
- Options should be clear and unique
- Questions should test conceptual understanding, not memorization
- Do not include any extra text outside JSON`;

  return groqChatJson(prompt);
}

/**
 * Generate DSA (coding) questions using Groq
 */
async function generateDSAQuestions(topic, difficulty, count = 1) {
  const prompt = `Generate ${count} unique ${difficulty} difficulty DSA coding problem(s) for placement preparation on the topic "${topic}".

Return a JSON array of objects with this exact shape:
[
  {
    "problemStatement": "string with constraints and examples",
    "functionName": "camelCase function name",
    "testCases": [
      { "input": "string", "expectedOutput": "string", "isHidden": false },
      { "input": "string", "expectedOutput": "string", "isHidden": true }
    ]
  }
]

Rules:
- Include 2-3 visible and 2-3 hidden test cases
- Inputs/outputs must be plain strings
- Difficulty should match ${difficulty}
- Do not include any extra text outside JSON`;

  const questions = await groqChatJson(prompt);

  // Generate starter code for each question
  return questions.map(q => ({
    ...q,
    starterCode: {
      javascript: `function ${q.functionName}(input) {\n  // Write your solution here\n  \n}`,
      python: `def ${q.functionName}(input):\n    # Write your solution here\n    pass`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\n// Write your solution here\nint main() {\n    \n    return 0;\n}`,
      java: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your solution here\n    }\n}`,
    },
    functionSignature: {
      javascript: `function ${q.functionName}(input)`,
      python: `def ${q.functionName}(input):`,
      cpp: `int main()`,
      java: `public static void main(String[] args)`,
    },
  }));
}
async function generateRandomQuestions(count = 15) {
  const questions = [];
  const mcqCount = Math.ceil(count * 0.6);
  const dsaCount = count - mcqCount;

  let remainingMcq = mcqCount;
  while (remainingMcq > 0) {
    const batch = Math.min(3, remainingMcq);
    const topic = pickRandom(TOPICS);
    const difficulty = pickRandom(DIFFICULTIES);
    const generated = await generateMCQQuestions(topic, difficulty, batch);
    generated.forEach(q => {
      questions.push({
        type: 'Aptitude',
        topic,
        difficulty,
        aiGenerated: true,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      });
    });
    remainingMcq -= batch;
  }

  let remainingDsa = dsaCount;
  while (remainingDsa > 0) {
    const batch = 1;
    const topic = pickRandom(TOPICS);
    const difficulty = pickRandom(DIFFICULTIES);
    const generated = await generateDSAQuestions(topic, difficulty, batch);
    generated.forEach(q => {
      questions.push({
        type: 'DSA',
        topic,
        difficulty,
        aiGenerated: true,
        problemStatement: q.problemStatement,
        functionSignature: q.functionSignature,
        starterCode: q.starterCode,
        testCases: q.testCases,
      });
    });
    remainingDsa -= batch;
  }

  return questions.slice(0, count);
}

async function generateFixedMixQuestions(dsaCount, aptitudeCount) {
  const questions = [];

  let remainingAptitude = aptitudeCount;
  while (remainingAptitude > 0) {
    const batch = Math.min(3, remainingAptitude);
    const topic = pickRandom(TOPICS);
    const difficulty = pickRandom(DIFFICULTIES);
    const generated = await generateMCQQuestions(topic, difficulty, batch);
    generated.forEach((q) => {
      questions.push({
        type: 'Aptitude',
        topic,
        difficulty,
        aiGenerated: true,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      });
    });
    remainingAptitude -= batch;
  }

  let remainingDsa = dsaCount;
  while (remainingDsa > 0) {
    const topic = pickRandom(TOPICS);
    const difficulty = pickRandom(DIFFICULTIES);
    const generated = await generateDSAQuestions(topic, difficulty, 1);
    generated.forEach((q) => {
      questions.push({
        type: 'DSA',
        topic,
        difficulty,
        aiGenerated: true,
        problemStatement: q.problemStatement,
        functionSignature: q.functionSignature,
        starterCode: q.starterCode,
        testCases: q.testCases,
      });
    });
    remainingDsa -= 1;
  }

  return questions.slice(0, dsaCount + aptitudeCount);
}

async function testGroq() {
  const result = await groqChatJson('Return JSON: {"ok": true}');
  return result;
}

module.exports = {
  generateMCQQuestions,
  generateDSAQuestions,
  generateRandomQuestions,
  generateFixedMixQuestions,
  testGroq,
};
