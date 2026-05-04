const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const config = require('../config/env');

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

const resumeSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    topics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: { type: SchemaType.STRING },
          difficulty: { type: SchemaType.STRING },
          question: { type: SchemaType.STRING },
          options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          correctAnswer: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING },
        },
        required: ['type', 'difficulty', 'question'],
      },
    },
  },
  required: ['summary', 'topics', 'questions'],
};

const FALLBACK_SKILLS = [
  'JavaScript', 'React', 'Node.js', 'MongoDB', 'Express', 'SQL', 'DSA',
  'Python', 'Java', 'C++', 'System Design', 'OOP', 'Operating Systems',
  'Networking', 'DBMS', 'Git', 'Docker', 'AWS', 'HTML', 'CSS',
];

async function extractResumeText(file) {
  if (!file) return '';

  if (file.mimetype === 'application/pdf') {
    const parsed = await pdfParse(file.buffer);
    return parsed.text || '';
  }

  if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value || '';
  }

  if (file.mimetype === 'text/plain') {
    return file.buffer.toString('utf8');
  }

  return '';
}

function extractTopicsFallback(text) {
  const found = new Set();
  const lower = text.toLowerCase();
  for (const skill of FALLBACK_SKILLS) {
    if (lower.includes(skill.toLowerCase())) found.add(skill);
  }
  if (found.size === 0) return ['DSA', 'JavaScript', 'Problem Solving'];
  return Array.from(found).slice(0, 8);
}

async function analyzeResumeText(text) {
  if (!config.gemini.apiKey) {
    return {
      summary: 'Resume analyzed using keyword matching. Add GEMINI_API_KEY for deeper insights.',
      topics: extractTopicsFallback(text),
      questions: [],
    };
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: resumeSchema,
    },
  });

  const prompt = `You are analyzing a software engineering resume. Extract key skills/topics and create 5 interview questions tailored to the candidate.\n\nResume text:\n${text}\n\nReturn JSON with:\n- summary: 1-2 sentence overview\n- topics: 5-8 key topics\n- questions: 5 questions with type (Aptitude or Technical), difficulty (easy|medium|hard), question text, and for aptitude include options + correctAnswer + explanation. Technical questions can omit options/correctAnswer.`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}

module.exports = { extractResumeText, analyzeResumeText };
