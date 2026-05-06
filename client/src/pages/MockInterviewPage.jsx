import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluateInterview, generateInterview } from '../api/client';
import { FileText, MessageSquareText, RefreshCcw, Send, Sparkles, Target } from 'lucide-react';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'mockInterviewSession';

function loadStoredSession() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export default function MockInterviewPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => {
    const stored = loadStoredSession();
    return {
      questions: stored?.questions || [],
      answers: stored?.answers || {},
      result: stored?.result || null,
      context: stored?.context || null,
      loading: !stored?.questions?.length,
      evaluating: false,
      generating: false,
    };
  });

  useEffect(() => {
    if (session.questions.length > 0) return;

    let active = true;
    generateInterview({ count: 6 })
      .then((res) => {
        if (!active) return;
        const next = {
          questions: res.data.questions || [],
          answers: {},
          result: null,
          context: res.data.context || null,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setSession((prev) => ({ ...prev, ...next, loading: false }));
      })
      .catch((err) => {
        if (!active) return;
        toast.error(err.response?.data?.message || 'Failed to generate interview questions');
        setSession((prev) => ({ ...prev, loading: false }));
      });

    return () => { active = false; };
  }, [session.questions.length]);

  const saveSession = (next) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      questions: next.questions,
      answers: next.answers,
      result: next.result,
      context: next.context,
    }));
  };

  const updateAnswer = (index, value) => {
    setSession((prev) => {
      const next = {
        ...prev,
        answers: { ...prev.answers, [index]: value },
        result: null,
      };
      saveSession(next);
      return next;
    });
  };

  const generateNew = async () => {
    setSession((prev) => ({ ...prev, generating: true, result: null }));
    try {
      const res = await generateInterview({ count: 6 });
      const next = {
        questions: res.data.questions || [],
        answers: {},
        result: null,
        context: res.data.context || null,
        loading: false,
        evaluating: false,
        generating: false,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSession(next);
      toast.success('New AI interview generated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate interview');
      setSession((prev) => ({ ...prev, generating: false }));
    }
  };

  const handleClear = () => {
    const next = { ...session, answers: {}, result: null };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
    toast.success('Answers cleared');
  };

  const handleSubmit = async () => {
    const answered = Object.values(session.answers).filter((answer) => answer.trim().length > 0).length;
    if (answered === 0) {
      toast.error('Write at least one answer before submitting');
      return;
    }

    setSession((prev) => ({ ...prev, evaluating: true }));
    try {
      const answers = session.questions.map((question, index) => ({
        question: question.question,
        answer: session.answers[index] || '',
      }));
      const res = await evaluateInterview({ questions: session.questions, answers });
      const next = { ...session, result: res.data.result, evaluating: false };
      saveSession(next);
      setSession(next);
      toast.success('Interview evaluated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to evaluate interview');
      setSession((prev) => ({ ...prev, evaluating: false }));
    }
  };

  if (session.loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const answeredCount = Object.values(session.answers).filter((answer) => answer.trim().length > 0).length;

  return (
    <div className="fade-in">
      <div className="page-header interview-header">
        <div>
          <span className="core-eyebrow"><Sparkles size={14} /> AI Mock Interview</span>
          <h1 className="page-title">Mock Interview</h1>
          <p className="page-subtitle">AI generates questions, reviews your answers, scores you, and shows exactly what to improve.</p>
        </div>
        <div className="interview-header-actions">
          <button className="btn btn-outline" onClick={() => navigate('/resume')}>
            <FileText size={16} /> Resume
          </button>
          <button className="btn btn-outline" onClick={handleClear} disabled={session.evaluating || session.generating}>
            <RefreshCcw size={16} /> Clear
          </button>
          <button className="btn btn-outline" onClick={generateNew} disabled={session.evaluating || session.generating}>
            <Sparkles size={16} /> {session.generating ? 'Generating...' : 'New AI Questions'}
          </button>
        </div>
      </div>

      {session.questions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <MessageSquareText size={48} style={{ color: 'var(--accent-cyan)', marginBottom: 16 }} />
          <h3 style={{ marginBottom: 8 }}>No interview questions yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Generate an AI interview to begin practicing.
          </p>
          <button className="btn btn-primary" onClick={generateNew}>
            <Sparkles size={16} /> Generate Interview
          </button>
        </div>
      ) : (
        <div className="interview-layout">
          <aside className="interview-score-panel">
            <div className="interview-score-card">
              <Target size={22} />
              <span>Score</span>
              <strong>{session.result?.overallScore ?? '--'}</strong>
              <p>{session.result ? 'Review your feedback below.' : `${answeredCount}/${session.questions.length} answered`}</p>
            </div>

            {session.result && (
              <div className="interview-feedback-summary">
                <h3>Overall Feedback</h3>
                <p>{session.result.summary}</p>
                <h4>Improve Next</h4>
                <ul>
                  {session.result.improvements?.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <button className="btn btn-primary" onClick={handleSubmit} disabled={session.evaluating || session.generating}>
              <Send size={16} /> {session.evaluating ? 'Evaluating...' : 'Submit Interview'}
            </button>
          </aside>

          <section className="card">
            <div className="card-header">
              <h3 className="card-title"><MessageSquareText size={18} /> Answer These AI Questions</h3>
            </div>
            <div className="interview-questions">
              {session.questions.map((q, i) => {
                const feedback = session.result?.feedback?.[i];
                return (
                  <div key={`${q.question}-${i}`} className="interview-question">
                    <div className="interview-question-meta">
                      <span className="badge badge-blue">{q.type || 'Technical'}</span>
                      <span className="resume-difficulty">{q.difficulty || 'medium'}</span>
                    </div>
                    <div className="interview-question-title">
                      {i + 1}. {q.question}
                    </div>
                    <textarea
                      className="interview-answer"
                      rows={5}
                      placeholder="Write your answer in interview style: context, approach, trade-offs, result..."
                      value={session.answers[i] || ''}
                      onChange={(e) => updateAnswer(i, e.target.value)}
                    />

                    {feedback && (
                      <div className="interview-result-card">
                        <div className="interview-result-top">
                          <span className={`badge ${feedback.score >= 75 ? 'badge-green' : feedback.score >= 50 ? 'badge-amber' : 'badge-rose'}`}>
                            {feedback.score}/100 - {feedback.verdict}
                          </span>
                        </div>
                        <div className="interview-feedback-grid">
                          <FeedbackBlock title="Where You Went Wrong" text={feedback.whatWentWrong} />
                          <FeedbackBlock title="What To Improve" text={feedback.improvement} />
                          <FeedbackBlock title="Better Answer Direction" text={feedback.idealAnswer} />
                        </div>
                        {feedback.missingPoints?.length > 0 && (
                          <div className="interview-missing-points">
                            <strong>Missing points:</strong>
                            <div className="topic-badges">
                              {feedback.missingPoints.map((point) => (
                                <span key={point} className="topic-badge weak">{point}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function FeedbackBlock({ title, text }) {
  return (
    <div>
      <h4>{title}</h4>
      <p>{text || 'No feedback available.'}</p>
    </div>
  );
}
