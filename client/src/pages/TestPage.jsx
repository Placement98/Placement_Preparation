import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { startTest, submitTest } from '../api/client';
import { Clock, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TestPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('intro'); // intro | testing | submitted
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(3600);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await startTest({});
      setQuestions(res.data.questions);
      setTimeLeft(res.data.timeLimit || 3600);
      setPhase('testing');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start test');
    }
    setLoading(false);
  };

  const handleSubmit = useCallback(async () => {
    if (phase !== 'testing') return;
    setPhase('submitted');
    setLoading(true);
    try {
      const answerArray = questions.map((q) => ({
        questionId: q._id,
        selectedAnswer: answers[q._id] || null,
      }));
      const res = await submitTest({ answers: answerArray, timeTaken: 3600 - timeLeft });
      setResult(res.data.result);
      toast.success('Test submitted!');
    } catch (err) {
      toast.error('Failed to submit test');
    }
    setLoading(false);
  }, [phase, questions, answers, timeLeft]);

  // Timer
  useEffect(() => {
    if (phase !== 'testing') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, handleSubmit]);

  const formatTime = (s) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const selectAnswer = (questionId, answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  // Intro screen
  if (phase === 'intro') {
    return (
      <div className="fade-in">
        <div className="page-header"><h1 className="page-title">Assessment Test</h1><p className="page-subtitle">Test your placement readiness</p></div>
        <div className="card" style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📝</div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: 12 }}>Ready to begin?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>This assessment contains a mix of DSA coding and Aptitude MCQ questions.</p>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', margin: '24px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <div><strong style={{ color: 'var(--text-primary)' }}>⏱</strong> 60 minutes</div>
            <div><strong style={{ color: 'var(--text-primary)' }}>📊</strong> Mixed questions</div>
            <div><strong style={{ color: 'var(--text-primary)' }}>🎯</strong> Auto-graded</div>
          </div>
          <button className="btn btn-primary btn-lg" onClick={handleStart} disabled={loading} style={{ marginTop: 16 }}>
            {loading ? 'Loading...' : 'Start Assessment'}
          </button>
        </div>
      </div>
    );
  }

  // Results screen
  if (phase === 'submitted') {
    return (
      <div className="fade-in">
        <div className="page-header"><h1 className="page-title">Test Results</h1></div>
        <div className="card" style={{ maxWidth: 600, margin: '20px auto', textAlign: 'center', padding: 40 }}>
          {loading ? <div className="spinner" style={{ margin: '0 auto' }} /> : result ? (
            <>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>{result.scores?.overall >= 70 ? '🎉' : result.scores?.overall >= 40 ? '💪' : '📚'}</div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 24 }}>
                {result.scores?.overall >= 70 ? 'Excellent Work!' : result.scores?.overall >= 40 ? 'Good Effort!' : 'Keep Practicing!'}
              </h2>
              <div className="stats-grid" style={{ maxWidth: 400, margin: '0 auto 24px' }}>
                <div className="stat-card blue"><div className="stat-card-value">{result.scores?.overall}%</div><div className="stat-card-label">Overall</div></div>
                <div className="stat-card green"><div className="stat-card-value">{result.correctAnswers}/{result.totalQuestions}</div><div className="stat-card-label">Correct</div></div>
              </div>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
                <span className="badge badge-purple">DSA: {result.scores?.DSA}%</span>
                <span className="badge badge-blue">Aptitude: {result.scores?.Aptitude}%</span>
              </div>
              {result.weakTopics?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: '0.9rem' }}>Topics to improve:</p>
                  <div className="topic-badges" style={{ justifyContent: 'center' }}>
                    {result.weakTopics.map((t) => <span key={t} className="topic-badge weak">{t}</span>)}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>Dashboard</button>
                <button className="btn btn-primary" onClick={() => navigate('/practice')}>Practice Weak Topics</button>
              </div>
            </>
          ) : <p>No results available</p>}
        </div>
      </div>
    );
  }

  // Test screen
  const q = questions[current];
  return (
    <div className="test-layout fade-in">
      <div className="test-sidebar">
        <div className="test-timer">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Time Remaining</div>
          <div className={`timer-value ${timeLeft < 300 ? 'danger' : timeLeft < 600 ? 'warning' : ''}`}>
            <Clock size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            {formatTime(timeLeft)}
          </div>
        </div>
        <div className="question-nav">
          {questions.map((_, i) => (
            <button
              key={i}
              className={`question-nav-btn ${i === current ? 'active' : ''} ${answers[questions[i]?._id] ? 'answered' : ''}`}
              onClick={() => setCurrent(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-danger" style={{ width: '100%' }} onClick={handleSubmit}>
            <Send size={16} /> Submit Test
          </button>
        </div>
        <div style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          {Object.keys(answers).length}/{questions.length} answered
        </div>
      </div>

      <div className="test-content">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span className={`badge ${q?.type === 'DSA' ? 'badge-purple' : 'badge-blue'}`}>{q?.type}</span>
            <span className={`badge ${q?.difficulty === 'easy' ? 'badge-green' : q?.difficulty === 'hard' ? 'badge-rose' : 'badge-amber'}`}>{q?.difficulty}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
            Question {current + 1} of {questions.length} • Topic: {q?.topic}
          </div>

          {q?.type === 'Aptitude' ? (
            <>
              <h3 style={{ fontSize: '1.1rem', lineHeight: 1.6, marginBottom: 8 }}>{q?.question}</h3>
              <div className="mcq-options">
                {q?.options?.map((opt, i) => (
                  <div
                    key={i}
                    className={`mcq-option ${answers[q._id] === opt ? 'selected' : ''}`}
                    onClick={() => selectAnswer(q._id, opt)}
                  >
                    <div className="mcq-option-marker">{String.fromCharCode(65 + i)}</div>
                    <span>{opt}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.95rem' }}>{q?.problemStatement}</div>
              {q?.testCases?.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: 12 }}>Sample Test Cases:</h4>
                  {q.testCases.map((tc, i) => (
                    <div key={i} style={{ background: 'var(--bg-glass)', padding: 12, borderRadius: 8, marginBottom: 8, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      <div><strong>Input:</strong> {tc.input}</div>
                      <div><strong>Expected:</strong> {tc.expectedOutput}</div>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                💡 Use the Code Editor page for DSA questions. Navigate there to write and test your code.
              </p>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
            <button className="btn btn-outline" onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}>
              <ChevronLeft size={16} /> Previous
            </button>
            <button className="btn btn-primary" onClick={() => setCurrent(Math.min(questions.length - 1, current + 1))} disabled={current === questions.length - 1}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
