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

async function generateCompanyQuestions(company, dsaCount = 3, aptitudeCount = 12) {
  const questions = [];
  const promptTopic = `${company} interview`;

  let remainingAptitude = aptitudeCount;
  while (remainingAptitude > 0) {
    const batch = Math.min(3, remainingAptitude);
    const difficulty = pickRandom(DIFFICULTIES);
    const generated = await generateMCQQuestions(promptTopic, difficulty, batch);
    generated.forEach((q) => {
      questions.push({
        type: 'Aptitude',
        topic: company,
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
    const difficulty = pickRandom(DIFFICULTIES);
    const generated = await generateDSAQuestions(promptTopic, difficulty, 1);
    generated.forEach((q) => {
      questions.push({
        type: 'DSA',
        topic: company,
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

function buildInterviewFallback(context = {}, count = 6) {
  const topics = context.topics && context.topics.length ? context.topics : ['DSA', 'projects', 'problem solving'];
  const primary = topics[0] || 'your strongest skill';
  const secondary = topics[1] || 'one project';

  return [
    {
      type: 'Resume',
      difficulty: 'easy',
      question: 'Tell me about yourself and connect your background to this role.',
      expectedPoints: ['Clear introduction', 'Relevant skills', 'Career goal'],
    },
    {
      type: 'Project',
      difficulty: 'medium',
      question: `Explain a project where you used ${primary}. What was your contribution and what challenge did you solve?`,
      expectedPoints: ['Project context', 'Own contribution', 'Challenge', 'Result'],
    },
    {
      type: 'Technical',
      difficulty: 'medium',
      question: `Your profile mentions ${secondary}. What are the core concepts behind it and where can it fail?`,
      expectedPoints: ['Conceptual clarity', 'Failure cases', 'Practical example'],
    },
    {
      type: 'DSA',
      difficulty: 'medium',
      question: 'How would you approach an unfamiliar DSA problem in an interview?',
      expectedPoints: ['Clarify input/output', 'Brute force', 'Optimize', 'Complexity'],
    },
    {
      type: 'Behavioral',
      difficulty: 'medium',
      question: 'Describe a time you received critical feedback and how you improved after it.',
      expectedPoints: ['Situation', 'Feedback', 'Action', 'Result'],
    },
    {
      type: 'Aptitude',
      difficulty: 'easy',
      question: 'A task takes 5 people 12 days. How many days will 3 people take at the same rate? Explain your calculation.',
      expectedPoints: ['60 person-days', 'Divide by 3', '20 days'],
    },
  ].slice(0, count);
}

async function generateInterviewQuestions(context = {}, count = 6) {
  if (!config.groq.apiKey) return buildInterviewFallback(context, count);

  const prompt = `Generate ${count} mock interview questions for a placement-prep student.

Candidate context:
${JSON.stringify(context, null, 2)}

Return only a JSON array with this exact shape:
[
  {
    "type": "Resume|Project|Technical|DSA|Aptitude|Behavioral|HR",
    "difficulty": "easy|medium|hard",
    "question": "specific interview question",
    "expectedPoints": ["3-5 key points a strong answer should include"]
  }
]

Rules:
- Questions must be specific to the candidate context when possible.
- Include at least 2 technical/project questions.
- Include one communication/HR or behavioral question.
- Include one aptitude or problem-solving explanation question.
- Do not include answers outside expectedPoints.
- Return valid JSON only.`;

  try {
    const questions = await groqChatJson(prompt);
    if (!Array.isArray(questions) || questions.length === 0) return buildInterviewFallback(context, count);
    return questions.slice(0, count).map((question, index) => ({
      type: question.type || 'Technical',
      difficulty: question.difficulty || 'medium',
      question: question.question || buildInterviewFallback(context, count)[index]?.question,
      expectedPoints: Array.isArray(question.expectedPoints) ? question.expectedPoints.slice(0, 6) : [],
    })).filter((question) => question.question);
  } catch (error) {
    return buildInterviewFallback(context, count);
  }
}

function evaluateInterviewFallback(questions, answers) {
  const feedback = questions.map((question, index) => {
    const answer = String(answers[index]?.answer || '').trim();
    const words = answer ? answer.split(/\s+/).length : 0;
    const expectedPoints = question.expectedPoints || [];
    const matched = expectedPoints.filter((point) => {
      const importantWords = String(point).toLowerCase().split(/\W+/).filter((word) => word.length > 4);
      return importantWords.some((word) => answer.toLowerCase().includes(word));
    });

    let score = Math.min(80, Math.round(words * 2.2));
    if (matched.length > 0) score = Math.min(95, score + matched.length * 8);
    if (words < 20) score = Math.min(score, 45);
    if (!answer) score = 0;

    return {
      question: question.question,
      score,
      verdict: score >= 75 ? 'Strong' : score >= 50 ? 'Needs polish' : 'Needs work',
      whatWentWrong: answer
        ? score >= 75
          ? 'No major issue. Add sharper examples and metrics to make the answer stronger.'
          : 'The answer is either too short, too generic, or misses important expected points.'
        : 'No answer was submitted for this question.',
      improvement: expectedPoints.length
        ? `Cover these points: ${expectedPoints.join(', ')}.`
        : 'Use a clear structure: context, action, technical detail, result.',
      idealAnswer: expectedPoints.length
        ? `A strong answer should mention ${expectedPoints.join(', ')} and connect it to a real example.`
        : 'A strong answer should be specific, structured, and backed by an example.',
      missingPoints: expectedPoints.filter((point) => !matched.includes(point)),
    };
  });

  const overallScore = feedback.length
    ? Math.round(feedback.reduce((sum, item) => sum + item.score, 0) / feedback.length)
    : 0;

  return {
    overallScore,
    summary: overallScore >= 75
      ? 'Good interview performance. Focus on making answers more concise and evidence-backed.'
      : 'Your answers need more structure, technical depth, and specific examples.',
    strengths: ['Attempted the interview flow', 'Can improve quickly with structured answers'],
    improvements: ['Use STAR for behavioral answers', 'Mention trade-offs and complexity for technical answers', 'Add measurable project impact'],
    feedback,
  };
}

async function evaluateInterviewAnswers(questions, answers, context = {}) {
  if (!config.groq.apiKey) return evaluateInterviewFallback(questions, answers);

  const prompt = `Evaluate this mock interview submission for a placement-prep student.

Candidate context:
${JSON.stringify(context, null, 2)}

Questions and expected points:
${JSON.stringify(questions, null, 2)}

Candidate answers:
${JSON.stringify(answers, null, 2)}

Return only valid JSON with this exact shape:
{
  "overallScore": 0-100,
  "summary": "2-3 sentence summary",
  "strengths": ["short bullet"],
  "improvements": ["short bullet"],
  "feedback": [
    {
      "question": "question text",
      "score": 0-100,
      "verdict": "Strong|Needs polish|Needs work",
      "whatWentWrong": "specific gaps or mistakes",
      "improvement": "specific improvement advice",
      "idealAnswer": "short model answer or answer structure",
      "missingPoints": ["missed concept or detail"]
    }
  ]
}

Rules:
- Be strict but encouraging.
- Score missing or one-line answers low.
- Explain exactly where the answer went wrong.
- Mention missing technical concepts, weak structure, vague claims, or incorrect reasoning.
- Do not include any text outside JSON.`;

  try {
    const result = await groqChatJson(prompt);
    if (!result || !Array.isArray(result.feedback)) return evaluateInterviewFallback(questions, answers);
    const overallScore = Number(result.overallScore);
    return {
      overallScore: Number.isFinite(overallScore) ? Math.max(0, Math.min(100, Math.round(overallScore))) : 0,
      summary: result.summary || '',
      strengths: Array.isArray(result.strengths) ? result.strengths : [],
      improvements: Array.isArray(result.improvements) ? result.improvements : [],
      feedback: result.feedback.map((item, index) => {
        const score = Number(item.score);
        return {
          question: item.question || questions[index]?.question || '',
          score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0,
          verdict: item.verdict || 'Needs polish',
          whatWentWrong: item.whatWentWrong || 'The answer needs more specific details.',
          improvement: item.improvement || 'Add structure, examples, and technical clarity.',
          idealAnswer: item.idealAnswer || '',
          missingPoints: Array.isArray(item.missingPoints) ? item.missingPoints : [],
        };
      }),
    };
  } catch (error) {
    return evaluateInterviewFallback(questions, answers);
  }
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
  generateCompanyQuestions,
  generateInterviewQuestions,
  evaluateInterviewAnswers,
  testGroq,
};
