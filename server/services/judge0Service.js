const axios = require('axios');
const config = require('../config/env');

const LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  cpp: 54,
  java: 62,
};

function ensureJudge0Configured() {
  if (!config.judge0.apiUrl) {
    throw new Error('Judge0 API URL not configured');
  }

  const isRapidApi = config.judge0.apiUrl.includes('rapidapi.com');
  if (isRapidApi && (!config.judge0.apiKey || !config.judge0.apiHost)) {
    throw new Error('Judge0 RapidAPI credentials not configured');
  }
}

function buildJudge0Client() {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (config.judge0.apiKey && config.judge0.apiHost) {
    headers['X-RapidAPI-Key'] = config.judge0.apiKey;
    headers['X-RapidAPI-Host'] = config.judge0.apiHost;
  }

  return axios.create({
    baseURL: config.judge0.apiUrl,
    headers,
    timeout: 20000,
  });
}

const judge0Client = buildJudge0Client();

/**
 * Submit code for execution against a single test case
 */
async function submitCode(sourceCode, languageId, stdin, expectedOutput) {
  try {
    ensureJudge0Configured();
    const response = await judge0Client.post('/submissions?base64_encoded=false&wait=true&fields=*', {
      source_code: sourceCode,
      language_id: languageId,
      stdin: stdin,
      expected_output: expectedOutput,
      cpu_time_limit: 5,
      memory_limit: 256000,
    });

    return response.data;
  } catch (error) {
    console.error('Judge0 submission error:', error.response?.data || error.message);
    throw new Error('Code execution service unavailable');
  }
}

/**
 * Submit code and run against multiple test cases using batch endpoint
 */
async function runBatchSubmissions(sourceCode, language, testCases) {
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) throw new Error(`Unsupported language: ${language}`);

  const submissions = testCases.map(tc => ({
    source_code: sourceCode,
    language_id: languageId,
    stdin: tc.input,
    expected_output: tc.expectedOutput.trim(),
    cpu_time_limit: 5,
    memory_limit: 256000,
  }));

  try {
    ensureJudge0Configured();
    // Submit batch
    const batchResponse = await judge0Client.post(
      '/submissions/batch?base64_encoded=false',
      { submissions }
    );

    const tokens = batchResponse.data.map(s => s.token);

    // Poll for results (wait up to 30 seconds)
    let results = [];
    let attempts = 0;
    const maxAttempts = 15;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const tokenStr = tokens.join(',');
      const statusResponse = await judge0Client.get(
        `/submissions/batch?tokens=${tokenStr}&base64_encoded=false&fields=stdout,stderr,status,time,memory,compile_output`
      );

      results = statusResponse.data.submissions;
      const allDone = results.every(r => r.status && r.status.id >= 3);

      if (allDone) break;
      attempts++;
    }

    // Map results
    return results.map((result, index) => {
      const expected = testCases[index].expectedOutput.trim();
      const actual = (result.stdout || '').trim();
      const status = result.status || {};

      let passed = false;
      if (status.id === 3) { // Accepted
        passed = actual === expected;
      }

      return {
        testCaseIndex: index,
        passed,
        output: actual || result.stderr || result.compile_output || 'No output',
        expected,
        time: result.time || '0',
        memory: result.memory ? `${Math.round(result.memory)} KB` : '0 KB',
        statusDescription: status.description || 'Unknown',
        error: result.stderr || result.compile_output || null,
      };
    });
  } catch (error) {
    console.error('Judge0 batch error:', error.response?.data || error.message);
    // Return mock results for development if Judge0 is unavailable
    return testCases.map((tc, index) => ({
      testCaseIndex: index,
      passed: false,
      output: 'Code execution service unavailable. Please configure Judge0 API settings.',
      expected: tc.expectedOutput,
      time: '0',
      memory: '0 KB',
      statusDescription: 'Service Unavailable',
      error: error.message || 'Judge0 not configured',
    }));
  }
}

/**
 * Run code with single test case (for "Run" button, not submit)
 */
async function runCode(sourceCode, language, stdin) {
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) throw new Error(`Unsupported language: ${language}`);

  try {
    ensureJudge0Configured();
    const result = await submitCode(sourceCode, languageId, stdin, null);
    return {
      output: (result.stdout || '').trim(),
      error: result.stderr || result.compile_output || null,
      time: result.time || '0',
      memory: result.memory ? `${Math.round(result.memory)} KB` : '0 KB',
      status: result.status?.description || 'Unknown',
    };
  } catch (error) {
    return {
      output: '',
      error: 'Code execution service unavailable',
      time: '0',
      memory: '0 KB',
      status: 'Error',
    };
  }
}

module.exports = { runBatchSubmissions, runCode, LANGUAGE_IDS };
