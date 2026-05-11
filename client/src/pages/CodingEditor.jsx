import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { getQuestions, runCode, submitCode, submitTest } from '../api/client';
import { Play, Send, CheckCircle, XCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'cpp', label: 'C++' },
  { id: 'java', label: 'Java' },
];

const STORAGE_KEY = 'assessmentSessionV1';
const DISQUALIFIED_RESULT_KEY = 'assessmentDisqualifiedResultV1';

const loadSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export default function CodingEditor() {
  const location = useLocation();
  const navigate = useNavigate();
  const fromTest = location.state?.fromTest;
  const focusQuestionId = location.state?.questionId;
  const [questions, setQuestions] = useState([]);
  const [selectedQ, setSelectedQ] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState('description'); // description | results
  const disqualifiedRef = useRef(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      if (fromTest) {
        const session = loadSession();
        const dsaQuestions = session?.questions?.filter((q) => q.type === 'DSA') || [];
        if (dsaQuestions.length > 0) {
          setQuestions(dsaQuestions);
          const target = dsaQuestions.find((q) => q._id === focusQuestionId) || dsaQuestions[0];
          const saved = session?.dsaAnswers?.[target._id];
          selectQuestion(target, saved);
          return;
        }
      }

      const res = await getQuestions({ type: 'DSA', limit: 50 });
      setQuestions(res.data.questions);
      if (res.data.questions.length > 0) {
        selectQuestion(res.data.questions[0]);
      }
    } catch { /* ignore */ }
  };

  const selectQuestion = (q, saved) => {
    const nextLanguage = saved?.language || language;
    if (nextLanguage !== language) setLanguage(nextLanguage);
    setSelectedQ(q);
    const starter = q.starterCode?.[nextLanguage] || `// Write your ${nextLanguage} solution here\n`;
    setCode(saved?.code || starter);
    setResults(null);
    setTab('description');
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (selectedQ) {
      setCode(selectedQ.starterCode?.[lang] || `// Write your ${lang} solution here\n`);
    }
  };

  useEffect(() => {
    if (!fromTest || !selectedQ) return;
    const session = loadSession();
    if (!session) return;
    const next = {
      ...session,
      dsaAnswers: {
        ...(session.dsaAnswers || {}),
        [selectedQ._id]: { code, language },
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, [fromTest, selectedQ, code, language]);

  const handleRun = async () => {
    if (!selectedQ) return;
    setRunning(true);
    setTab('results');
    try {
      const res = await runCode({ code, language, questionId: selectedQ._id });
      setResults(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to run code');
    }
    setRunning(false);
  };

  const handleSubmit = async () => {
    if (!selectedQ) return;
    setSubmitting(true);
    setTab('results');
    try {
      const res = await submitCode({ code, language, questionId: selectedQ._id });
      setResults(res.data);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    }
    setSubmitting(false);
  };

  const handleDisqualify = useCallback(async () => {
    if (!fromTest || disqualifiedRef.current) return;
    disqualifiedRef.current = true;

    const session = loadSession();
    const questionsForSubmit = session?.questions || [];
    const startedAt = session?.startedAt;
    const timeLimit = session?.timeLimit || 3600;
    const elapsed = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
    const timeTaken = Math.min(timeLimit, Math.max(0, elapsed));

    if (questionsForSubmit.length === 0) {
      toast.error('Assessment canceled: tab switch detected.');
      localStorage.removeItem(STORAGE_KEY);
      navigate('/test');
      return;
    }

    try {
      const answerArray = questionsForSubmit.map((q) => (
        q.type === 'Aptitude'
          ? { questionId: q._id, selectedAnswer: null }
          : { questionId: q._id, code: '', language: 'javascript' }
      ));
      const res = await submitTest({
        answers: answerArray,
        timeTaken,
        roundId: session?.round?.id || null,
      });
      localStorage.setItem(DISQUALIFIED_RESULT_KEY, JSON.stringify({
        result: res.data.result,
        message: 'Assessment canceled: tab switch detected. Your score is 0.',
        toastMessage: 'Assessment canceled: tab switch detected.',
      }));
      localStorage.removeItem(STORAGE_KEY);
      navigate('/test');
    } catch (err) {
      toast.error('Failed to cancel test');
      navigate('/test');
    }
  }, [fromTest, navigate]);

  useEffect(() => {
    if (!fromTest) return;
    const handleVisibility = () => {
      if (document.hidden) handleDisqualify();
    };
    const handleBlur = () => handleDisqualify();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    };
  }, [fromTest, handleDisqualify]);

  const monacoLang = language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : language === 'python' ? 'python' : 'javascript';

  return (
    <div className="editor-layout">
      {/* Left panel: Problem description */}
      <div className="editor-left">
        {/* Question selector */}
        <div style={{ marginBottom: 20 }}>
          <select
            className="form-select"
            value={selectedQ?._id || ''}
            onChange={(e) => {
              const q = questions.find((q) => q._id === e.target.value);
              if (q) selectQuestion(q);
            }}
          >
            <option value="">Select a problem...</option>
            {questions.map((q) => (
              <option key={q._id} value={q._id}>
                [{q.difficulty}] {q.topic} — {q.problemStatement?.substring(0, 50) || 'Problem'}
              </option>
            ))}
          </select>
        </div>

        {selectedQ ? (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <span className="badge badge-purple">{selectedQ.topic}</span>
              <span className={`badge ${selectedQ.difficulty === 'easy' ? 'badge-green' : selectedQ.difficulty === 'hard' ? 'badge-rose' : 'badge-amber'}`}>
                {selectedQ.difficulty}
              </span>
            </div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: 24 }}>
              {selectedQ.problemStatement}
            </div>

            {selectedQ.testCases?.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--text-secondary)' }}>Test Cases</h4>
                {selectedQ.testCases.map((tc, i) => (
                  <div key={i} style={{ background: 'var(--bg-glass)', padding: 12, borderRadius: 8, marginBottom: 8, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', border: '1px solid var(--border)' }}>
                    <div style={{ marginBottom: 4 }}><span style={{ color: 'var(--text-muted)' }}>Input: </span>{tc.input}</div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Output: </span>{tc.expectedOutput}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="empty-state"><p>Select a problem to begin</p></div>
        )}
      </div>

      {/* Right panel: Editor + Results */}
      <div className="editor-right">
        <div className="editor-toolbar">
          <div className="editor-lang-row">
            {LANGUAGES.map((l) => (
              <button
                key={l.id}
                className={`btn btn-sm ${language === l.id ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleLanguageChange(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="editor-action-row">
            <button className="btn btn-outline btn-sm" onClick={handleRun} disabled={running || !selectedQ}>
              {running ? <Loader size={14} className="spinning" /> : <Play size={14} />} Run
            </button>
            <button className="btn btn-success btn-sm" onClick={handleSubmit} disabled={submitting || !selectedQ}>
              {submitting ? <Loader size={14} className="spinning" /> : <Send size={14} />} Submit
            </button>
            {fromTest && (
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/test')}>
                Back to Assessment
              </button>
            )}
          </div>
        </div>

        <div className="editor-area">
          <Editor
            height="100%"
            language={monacoLang}
            value={code}
            onChange={(v) => setCode(v || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              padding: { top: 16 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
            }}
          />
        </div>

        <div className="editor-results">
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <button className={`btn btn-sm ${tab === 'results' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('results')}>Test Results</button>
          </div>

          {running || submitting ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <p>{running ? 'Running code...' : 'Submitting...'}</p>
            </div>
          ) : results ? (
            <>
              <div style={{ marginBottom: 12, fontSize: '0.9rem' }}>
                <strong>{results.passed || 0}</strong> / <strong>{results.total || results.results?.length || 0}</strong> test cases passed
              </div>
              {results.results?.map((r, i) => (
                <div key={i} className={`test-case-result ${r.passed ? 'pass' : 'fail'}`}>
                  <div style={{ flex: '0 0 auto' }}>
                    {r.passed ? <CheckCircle size={18} color="var(--accent-emerald)" /> : <XCircle size={18} color="var(--accent-rose)" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {r.isHidden ? `Hidden Test Case ${i + 1}` : `Test Case ${i + 1}`}
                    </div>
                    {!r.isHidden && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                        {r.output && <div>Output: {r.output}</div>}
                        {r.expected && <div>Expected: {r.expected}</div>}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {r.time && `${r.time}s`} {r.memory && `· ${r.memory}`}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
              <p>Run or submit your code to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
