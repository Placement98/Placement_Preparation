import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getQuestions, generateCompanyQuestions, submitCode, submitTest } from '../api/client';
import Editor from '@monaco-editor/react';
import { BookOpen, ChevronRight, ChevronLeft, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import COMPANIES from '../data/companies';

const TOPICS = ['Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs', 'Dynamic Programming', 'Sorting', 'Searching', 'Probability', 'Logical Reasoning', 'Quantitative Aptitude', 'Verbal Ability'];

export default function PracticePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(searchParams.get('topic') || '');
  const [difficulty, setDifficulty] = useState('all');
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [companySearch, setCompanySearch] = useState('');
  const [skipNextLoad, setSkipNextLoad] = useState(false);

  useEffect(() => {
    if (!topic) return;
    if (skipNextLoad) {
      setSkipNextLoad(false);
      return;
    }
    loadQuestions();
  }, [topic, difficulty]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const params = { topic, limit: 10 };
      if (difficulty !== 'all') params.difficulty = difficulty;
      const res = await getQuestions(params);
      setQuestions(res.data.questions);
      setCurrent(0);
      setAnswers({});
      setFeedback({});
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleCompanySelect = async (company) => {
    setLoading(true);
    try {
      const res = await generateCompanyQuestions({ company, dsaCount: 3, aptitudeCount: 12 });
      setSkipNextLoad(true);
      setTopic(company);
      setDifficulty('all');
      setQuestions(res.data.questions || []);
      setCurrent(0);
      setAnswers({});
      setFeedback({});
      toast.success(`Generated ${res.data.questions?.length || 0} questions for ${company}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate company questions');
    }
    setLoading(false);
  };

  const checkMCQ = (questionId, selected, correct) => {
    setAnswers(prev => ({ ...prev, [questionId]: selected }));
    const isCorrect = selected === correct;
    setFeedback(prev => ({ ...prev, [questionId]: isCorrect }));
    if (isCorrect) toast.success('Correct! 🎉');
    else toast.error('Incorrect. Try again!');
  };

  const filteredCompanies = COMPANIES.filter((company) =>
    company.toLowerCase().includes(companySearch.trim().toLowerCase())
  );

  if (!topic) {
    return (
      <div className="fade-in">
        <div className="page-header"><h1 className="page-title">Practice</h1><p className="page-subtitle">Choose a topic or company to practice</p></div>
        <div className="practice-topic-grid">
          {TOPICS.map(t => (
            <div key={t} className="card" style={{ cursor: 'pointer', textAlign: 'center', padding: 24 }} onClick={() => setTopic(t)}>
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>
                {t.includes('Array') ? '📊' : t.includes('String') ? '🔤' : t.includes('Tree') ? '🌳' : t.includes('Graph') ? '🕸️' : t.includes('Prob') ? '🎲' : t.includes('Logic') ? '🧩' : t.includes('Quant') ? '🧮' : '📖'}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 32 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ marginBottom: 12 }}>Company-Based Practice</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Pick a company to generate a fresh set of 15 questions.</p>
            <input
              className="form-input"
              placeholder="Search companies..."
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            <div className="practice-company-grid">
              {filteredCompanies.map((company) => (
                <button
                  key={company}
                  className="btn btn-outline"
                  onClick={() => handleCompanySelect(company)}
                  disabled={loading}
                  style={{ justifyContent: 'center' }}
                >
                  {company}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="practice-header-row">
          <div>
            <h1 className="page-title">Practice: {topic}</h1>
            <p className="page-subtitle">{questions.length} questions loaded</p>
          </div>
          <div className="practice-filters">
            {['all', 'easy', 'medium', 'hard'].map(d => (
              <button key={d} className={`btn btn-sm ${difficulty === d ? 'btn-primary' : 'btn-outline'}`} onClick={() => setDifficulty(d)}>{d}</button>
            ))}
            <button className="btn btn-sm btn-outline" onClick={() => setTopic('')}>Change Topic</button>
          </div>
        </div>
      </div>

      {loading ? <div className="loading-screen"><div className="spinner" /></div> : !q ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📭</div>
          <h3 style={{ marginBottom: 8 }}>No questions found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Try a different topic or difficulty</p>
        </div>
      ) : (
        <div className="card">
          <div className="question-toolbar">
            <span className={`badge ${q.type === 'DSA' ? 'badge-purple' : 'badge-blue'}`}>{q.type}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{current + 1} / {questions.length}</span>
          </div>

          {q.type === 'Aptitude' ? (
            <>
              <h3 style={{ fontSize: '1.1rem', lineHeight: 1.6, marginBottom: 20 }}>{q.question}</h3>
              <div className="mcq-options">
                {q.options?.map((opt, i) => {
                  const answered = answers[q._id];
                  const isSelected = answered === opt;
                  const showFeedback = feedback[q._id] !== undefined;
                  return (
                    <div
                      key={i}
                      className={`mcq-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => !answered && checkMCQ(q._id, opt, q.correctAnswer)}
                      style={{
                        cursor: answered ? 'default' : 'pointer',
                        ...(showFeedback && isSelected && feedback[q._id] ? { borderColor: 'var(--accent-emerald)', background: 'rgba(16,185,129,0.1)' } : {}),
                        ...(showFeedback && isSelected && !feedback[q._id] ? { borderColor: 'var(--accent-rose)', background: 'rgba(244,63,94,0.1)' } : {}),
                      }}
                    >
                      <div className="mcq-option-marker">{String.fromCharCode(65 + i)}</div>
                      <span>{opt}</span>
                      {showFeedback && isSelected && (feedback[q._id] ? <CheckCircle size={18} color="var(--accent-emerald)" /> : <XCircle size={18} color="var(--accent-rose)" />)}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, marginBottom: 20 }}>{q.problemStatement}</div>
              <button className="btn btn-primary" onClick={() => navigate(`/coding`)}>
                Open in Code Editor <ArrowRight size={16} />
              </button>
            </>
          )}

          <div className="question-arrows">
            <button className="btn btn-outline" disabled={current === 0} onClick={() => setCurrent(current - 1)}>
              <ChevronLeft size={16} /> Previous
            </button>
            <button className="btn btn-primary" disabled={current >= questions.length - 1} onClick={() => setCurrent(current + 1)}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
