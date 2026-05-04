/**
 * Seed script - Populates the database with sample questions
 * Run: node utils/seed.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/placement-prep';

const sampleQuestions = [
  // Aptitude Questions
  {
    type: 'Aptitude',
    difficulty: 'easy',
    topic: 'Probability',
    question: 'A bag contains 5 red and 3 blue balls. If a ball is drawn at random, what is the probability that it is red?',
    options: ['5/8', '3/8', '5/3', '3/5'],
    correctAnswer: '5/8',
    explanation: 'Total balls = 5 + 3 = 8. Red balls = 5. Probability = 5/8.',
  },
  {
    type: 'Aptitude',
    difficulty: 'medium',
    topic: 'Probability',
    question: 'Two dice are thrown simultaneously. What is the probability that the sum is 7?',
    options: ['1/6', '5/36', '7/36', '1/12'],
    correctAnswer: '1/6',
    explanation: 'Favorable outcomes: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6. Total outcomes = 36. P = 6/36 = 1/6.',
  },
  {
    type: 'Aptitude',
    difficulty: 'easy',
    topic: 'Logical Reasoning',
    question: 'If all roses are flowers and some flowers fade quickly, which statement is definitely true?',
    options: [
      'All roses fade quickly',
      'Some roses fade quickly',
      'No roses fade quickly',
      'None of these can be concluded'
    ],
    correctAnswer: 'None of these can be concluded',
    explanation: 'From "all roses are flowers" and "some flowers fade quickly", we cannot definitively conclude anything about roses fading.',
  },
  {
    type: 'Aptitude',
    difficulty: 'medium',
    topic: 'Quantitative Aptitude',
    question: 'A train 150m long passes a pole in 15 seconds. How long will it take to pass a platform 300m long?',
    options: ['30 seconds', '45 seconds', '25 seconds', '35 seconds'],
    correctAnswer: '45 seconds',
    explanation: 'Speed = 150/15 = 10 m/s. To pass platform, total distance = 150 + 300 = 450m. Time = 450/10 = 45 seconds.',
  },
  {
    type: 'Aptitude',
    difficulty: 'hard',
    topic: 'Quantitative Aptitude',
    question: 'The compound interest on Rs.30,000 at 7% per annum for 2 years is:',
    options: ['Rs.4,347', 'Rs.4,200', 'Rs.4,147', 'Rs.4,247'],
    correctAnswer: 'Rs.4,347',
    explanation: 'CI = P(1 + R/100)^n - P = 30000(1.07)^2 - 30000 = 30000(1.1449) - 30000 = 34347 - 30000 = Rs.4,347.',
  },
  {
    type: 'Aptitude',
    difficulty: 'easy',
    topic: 'Verbal Ability',
    question: 'Choose the synonym of "Eloquent":',
    options: ['Silent', 'Articulate', 'Confused', 'Boring'],
    correctAnswer: 'Articulate',
    explanation: 'Eloquent means fluent or persuasive in speaking or writing, which is synonymous with articulate.',
  },
  {
    type: 'Aptitude',
    difficulty: 'medium',
    topic: 'Logical Reasoning',
    question: 'In a certain code language, "COMPUTER" is written as "DNPQVUFS". How is "KEYBOARD" written in that code?',
    options: ['LFZCPBSE', 'LFZCAPSE', 'LFZBPBSE', 'KFZCPBSE'],
    correctAnswer: 'LFZCPBSE',
    explanation: 'Each letter is replaced by the next letter in the alphabet: K→L, E→F, Y→Z, B→C, O→P, A→B, R→S, D→E.',
  },
  // DSA Questions
  {
    type: 'DSA',
    difficulty: 'easy',
    topic: 'Arrays',
    problemStatement: '## Two Sum\n\nGiven an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`.\n\n**Constraints:**\n- 2 <= nums.length <= 10^4\n- -10^9 <= nums[i] <= 10^9\n- Exactly one solution exists\n\n**Input Format:** First line contains space-separated array elements. Second line contains the target.\n\n**Output Format:** Two space-separated indices (0-indexed).',
    functionSignature: {
      javascript: 'function twoSum(nums, target)',
      python: 'def two_sum(nums, target):',
      cpp: 'vector<int> twoSum(vector<int>& nums, int target)',
      java: 'public static int[] twoSum(int[] nums, int target)',
    },
    starterCode: {
      javascript: '// Read input\nconst readline = require("readline");\nconst rl = readline.createInterface({ input: process.stdin });\nconst lines = [];\nrl.on("line", (line) => lines.push(line.trim()));\nrl.on("close", () => {\n  const nums = lines[0].split(" ").map(Number);\n  const target = parseInt(lines[1]);\n  // Write your solution here\n  \n});',
      python: 'nums = list(map(int, input().split()))\ntarget = int(input())\n# Write your solution here\n',
      cpp: '#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    string line;\n    getline(cin, line);\n    // Parse input and solve\n    return 0;\n}',
      java: 'import java.util.*;\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Read input and solve\n    }\n}',
    },
    testCases: [
      { input: '2 7 11 15\n9', expectedOutput: '0 1', isHidden: false },
      { input: '3 2 4\n6', expectedOutput: '1 2', isHidden: false },
      { input: '3 3\n6', expectedOutput: '0 1', isHidden: true },
      { input: '-1 -2 -3 -4 -5\n-8', expectedOutput: '2 4', isHidden: true },
    ],
  },
  {
    type: 'DSA',
    difficulty: 'medium',
    topic: 'Arrays',
    problemStatement: '## Maximum Subarray Sum\n\nGiven an integer array `nums`, find the contiguous subarray with the largest sum and return that sum.\n\n**Constraints:**\n- 1 <= nums.length <= 10^5\n- -10^4 <= nums[i] <= 10^4\n\n**Input Format:** Space-separated integers.\n\n**Output Format:** A single integer (the maximum subarray sum).',
    functionSignature: {
      javascript: 'function maxSubarraySum(nums)',
      python: 'def max_subarray_sum(nums):',
      cpp: 'int maxSubarraySum(vector<int>& nums)',
      java: 'public static int maxSubarraySum(int[] nums)',
    },
    starterCode: {
      javascript: 'const readline = require("readline");\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on("line", (line) => {\n  const nums = line.trim().split(" ").map(Number);\n  // Write your solution here\n  \n});',
      python: 'nums = list(map(int, input().split()))\n# Write your solution here\n',
      cpp: '#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    // Read input and solve\n    return 0;\n}',
      java: 'import java.util.*;\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Read input and solve\n    }\n}',
    },
    testCases: [
      { input: '-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isHidden: false },
      { input: '1', expectedOutput: '1', isHidden: false },
      { input: '5 4 -1 7 8', expectedOutput: '23', isHidden: false },
      { input: '-1 -2 -3 -4', expectedOutput: '-1', isHidden: true },
      { input: '1 2 3 4 5', expectedOutput: '15', isHidden: true },
    ],
  },
  {
    type: 'DSA',
    difficulty: 'hard',
    topic: 'Linked Lists',
    problemStatement: '## Reverse a Linked List in Groups of K\n\nGiven the values of a linked list and an integer `k`, reverse the nodes of the list `k` at a time and return the resulting list as a space-separated string.\n\n**Constraints:**\n- 1 <= n <= 5000\n- 1 <= k <= n\n\n**Input Format:** First line: space-separated node values. Second line: k.\n\n**Output Format:** Space-separated resulting values.',
    functionSignature: {
      javascript: 'function reverseKGroup(values, k)',
      python: 'def reverse_k_group(values, k):',
      cpp: 'void reverseKGroup(vector<int>& values, int k)',
      java: 'public static void reverseKGroup(int[] values, int k)',
    },
    starterCode: {
      javascript: 'const readline = require("readline");\nconst rl = readline.createInterface({ input: process.stdin });\nconst lines = [];\nrl.on("line", (line) => lines.push(line.trim()));\nrl.on("close", () => {\n  const values = lines[0].split(" ").map(Number);\n  const k = parseInt(lines[1]);\n  // Write your solution here\n  \n});',
      python: 'values = list(map(int, input().split()))\nk = int(input())\n# Write your solution here\n',
      cpp: '#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    // Read input and solve\n    return 0;\n}',
      java: 'import java.util.*;\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Read input and solve\n    }\n}',
    },
    testCases: [
      { input: '1 2 3 4 5\n2', expectedOutput: '2 1 4 3 5', isHidden: false },
      { input: '1 2 3 4 5\n3', expectedOutput: '3 2 1 4 5', isHidden: false },
      { input: '1\n1', expectedOutput: '1', isHidden: true },
      { input: '1 2 3 4 5 6\n6', expectedOutput: '6 5 4 3 2 1', isHidden: true },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const Question = require('../models/Question');
    const User = require('../models/User');

    // Clear existing data
    await Question.deleteMany({});
    console.log('Cleared existing questions');

    // Insert sample questions
    await Question.insertMany(sampleQuestions);
    console.log(`Inserted ${sampleQuestions.length} sample questions`);

    // Create admin user if not exists
    const adminExists = await User.findOne({ email: 'admin@placementprep.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: 'admin@placementprep.com',
        password: 'admin123',
        role: 'admin',
      });
      console.log('Created admin user (admin@placementprep.com / admin123)');
    }

    console.log('\n✅ Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
