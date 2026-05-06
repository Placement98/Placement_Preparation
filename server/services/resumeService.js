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
    atsScore: { type: SchemaType.NUMBER },
    atsBreakdown: {
      type: SchemaType.OBJECT,
      properties: {
        contact: { type: SchemaType.NUMBER },
        sections: { type: SchemaType.NUMBER },
        keywords: { type: SchemaType.NUMBER },
        impact: { type: SchemaType.NUMBER },
        length: { type: SchemaType.NUMBER },
        formatting: { type: SchemaType.NUMBER },
      },
    },
    improvements: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
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
  required: ['summary', 'topics', 'questions', 'atsScore'],
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

function normalizeText(text) {
  return (text || '')
    .replace(/\r/g, '\n')
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .trim();
}

function detectSections(text) {
  const lower = text.toLowerCase();
  return {
    summary: /(summary|objective|profile)/i.test(lower),
    experience: /(experience|employment|work history|professional experience)/i.test(lower),
    education: /(education|academics|academic)/i.test(lower),
    skills: /(skills|technologies|technical skills)/i.test(lower),
    projects: /(projects?|project experience)/i.test(lower),
    certifications: /(certifications?|licenses|coursework)/i.test(lower),
  };
}

function calculateAtsScore(text) {
  const normalized = normalizeText(text);
  const words = normalized ? normalized.split(/\s+/).length : 0;
  const lines = normalized ? normalized.split(/\n+/) : [];

  const hasEmail = /[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(normalized);
  const hasPhone = /(\+?\d[\d\s().-]{7,})/.test(normalized);
  const hasLinkedIn = /linkedin\.com\/in\//i.test(normalized);
  const hasGithub = /github\.com\//i.test(normalized);
  const contactHits = [hasEmail, hasPhone, hasLinkedIn, hasGithub].filter(Boolean).length;

  const sections = detectSections(normalized);
  const sectionCount = Object.values(sections).filter(Boolean).length;

  const foundSkills = extractTopicsFallback(normalized);
  const keywordScore = Math.min(1, foundSkills.length / 8);

  const bulletLines = lines.filter((line) => /^\s*[-*]/.test(line)).length;
  const formattingScore = Math.min(1, bulletLines / 10);

  const metricsCount = (normalized.match(/\b\d+(\.\d+)?%?\b/g) || []).length;
  const impactScore = Math.min(1, metricsCount / 10);

  const lengthScore = words < 250 ? 0.4 : words <= 900 ? 1 : 0.6;
  const contactScore = Math.min(1, contactHits / 3);
  const sectionScore = Math.min(1, sectionCount / 5);

  const breakdown = {
    contact: Math.round(contactScore * 10),
    sections: Math.round(sectionScore * 20),
    keywords: Math.round(keywordScore * 25),
    impact: Math.round(impactScore * 20),
    length: Math.round(lengthScore * 15),
    formatting: Math.round(formattingScore * 10),
  };

  const score = Object.values(breakdown).reduce((sum, v) => sum + v, 0);

  const improvements = [];
  if (!hasEmail || !hasPhone) improvements.push('Add clear contact details (email and phone).');
  if (sectionCount < 4) improvements.push('Add distinct sections like Experience, Skills, Education, and Projects.');
  if (foundSkills.length < 5) improvements.push('Include more relevant skills and tools to improve keyword coverage.');
  if (metricsCount < 3) improvements.push('Quantify impact with metrics (e.g., % improvement, time saved).');
  if (words < 250) improvements.push('Add more detail to reach a fuller resume length.');
  if (bulletLines < 5) improvements.push('Use bullet points for readability and ATS parsing.');

  return {
    score: Math.max(0, Math.min(100, score)),
    breakdown,
    improvements,
    keywords: foundSkills,
  };
}

async function analyzeResumeText(text) {
  const normalized = normalizeText(text);
  const ats = calculateAtsScore(normalized);
  const trimmedText = normalized.slice(0, 12000);

  if (!config.gemini.apiKey) {
    return {
      summary: 'Resume analyzed using keyword matching. Add GEMINI_API_KEY for deeper insights.',
      topics: ats.keywords,
      atsScore: ats.score,
      atsBreakdown: ats.breakdown,
      improvements: ats.improvements,
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

  const prompt = `You are analyzing a software engineering resume for ATS readiness and interview prep.\n\nResume text:\n${trimmedText}\n\nReturn JSON with:\n- summary: 1-2 sentence overview\n- topics: 5-8 key topics\n- atsScore: 0-100\n- atsBreakdown: { contact, sections, keywords, impact, length, formatting } (numbers that add to 100)\n- improvements: 4-6 short bullets to improve ATS score\n- questions: 5 questions with type (Aptitude or Technical), difficulty (easy|medium|hard), question text, and for aptitude include options + correctAnswer + explanation. Technical questions can omit options/correctAnswer.`;

  try {
    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    return {
      summary: parsed.summary || 'Resume analyzed successfully.',
      topics: parsed.topics && parsed.topics.length ? parsed.topics : ats.keywords,
      atsScore: Number.isFinite(parsed.atsScore) ? Math.max(0, Math.min(100, parsed.atsScore)) : ats.score,
      atsBreakdown: parsed.atsBreakdown && typeof parsed.atsBreakdown === 'object' ? parsed.atsBreakdown : ats.breakdown,
      improvements: parsed.improvements && parsed.improvements.length ? parsed.improvements : ats.improvements,
      questions: parsed.questions || [],
    };
  } catch (error) {
    return {
      summary: 'Resume analyzed with ATS heuristics after AI parsing failed.',
      topics: ats.keywords,
      atsScore: ats.score,
      atsBreakdown: ats.breakdown,
      improvements: ats.improvements,
      questions: [],
    };
  }
}

module.exports = { extractResumeText, analyzeResumeText };
