const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const config = require('../config/env');

function getGeminiModel(schema) {
  if (!config.gemini.apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  return genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });
}

// Schema for MCQ questions
const mcqSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      question: { type: SchemaType.STRING, description: 'The question text' },
      options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: '4 options labeled A, B, C, D' },
      correctAnswer: { type: SchemaType.STRING, description: 'The correct option text' },
      explanation: { type: SchemaType.STRING, description: 'Brief explanation of the answer' },
    },
    required: ['question', 'options', 'correctAnswer', 'explanation'],
  },
};

// Schema for DSA questions
const dsaSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      problemStatement: { type: SchemaType.STRING, description: 'Detailed problem description with constraints and examples' },
      functionName: { type: SchemaType.STRING, description: 'Name of the function to implement' },
      testCases: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            input: { type: SchemaType.STRING, description: 'Input as a string' },
            expectedOutput: { type: SchemaType.STRING, description: 'Expected output as a string' },
            isHidden: { type: SchemaType.BOOLEAN, description: 'Whether this test case is hidden from user' },
          },
          required: ['input', 'expectedOutput', 'isHidden'],
        },
      },
    },
    required: ['problemStatement', 'functionName', 'testCases'],
  },
};

/**
 * Generate aptitude (MCQ) questions using Gemini AI
 */
async function generateMCQQuestions(topic, difficulty, count = 3) {
  const model = getGeminiModel(mcqSchema);

  const prompt = `Generate ${count} unique ${difficulty} difficulty multiple choice questions for placement preparation on the topic "${topic}".
  
Requirements:
- Each question must have exactly 4 options
- Questions should be challenging but fair for ${difficulty} level
- Include clear explanations for each answer
- Topics commonly asked in tech company placements
- Questions should test conceptual understanding, not just memorization`;

  const result = await model.generateContent(prompt);
  const questions = JSON.parse(result.response.text());
  return questions;
}

/**
 * Generate DSA (coding) questions using Gemini AI
 */
async function generateDSAQuestions(topic, difficulty, count = 1) {
  const model = getGeminiModel(dsaSchema);

  const prompt = `Generate ${count} unique ${difficulty} difficulty DSA coding problem(s) for placement preparation on the topic "${topic}".

Requirements:
- Clear problem statement with constraints (input size, time complexity expected)
- Include 2-3 visible test cases and 2-3 hidden test cases
- The function name should be descriptive (e.g., "twoSum", "maxSubarraySum")
- Input format: space-separated values or newline-separated, clearly described
- Output format: single value or space-separated values
- Test cases should cover edge cases
- Difficulty: ${difficulty} - typical for tech company coding rounds`;

  const result = await model.generateContent(prompt);
  const questions = JSON.parse(result.response.text());

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

module.exports = { generateMCQQuestions, generateDSAQuestions };
