import { useState } from 'react';
import { generateCoreQuestions } from '../api/client';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const SUBJECTS = [
  'DBMS',
  'SQL',
  'Operating Systems',
  'Computer Networks',
  'OOP',
  'DSA',
  'Software Engineering',
];

export default function CoreSubjectsPage() {
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (nextSubject) => {
    const chosen = nextSubject || subject;
    if (!chosen) {
      toast.error('Choose a subject first');
      return;
    }

    setLoading(true);
    try {
      const res = await generateCoreQuestions({ subject: chosen, difficulty, count });
      setSubject(chosen);
      setQuestions(res.data.questions || []);
      setCurrent(0);
      setAnswers({});
      setFeedback({});
      toast.success(`Generated ${res.data.questions?.length || 0} questions`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate questions');
    }
    setLoading(false);
  };

  const checkMCQ = (questionId, selected, correct) => {
    setAnswers((prev) => ({ ...prev, [questionId]: selected }));
    const isCorrect = selected === correct;
    setFeedback((prev) => ({ ...prev, [questionId]: isCorrect }));
    if (isCorrect) toast.success('Correct!');
    else toast.error('Incorrect.');
  };

  if (!subject || questions.length === 0) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1 className="page-title">Core Subjects</h1>
          <p className="page-subtitle">Generate fresh MCQs for core CS topics</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {SUBJECTS.map((item) => (
            <button
              key={item}
              className="card"
              style={{
                cursor: 'pointer',
                textAlign: 'center',
                padding: 24,
                borderColor: subject === item ? 'var(--accent-blue)' : undefined,
              }}
              onClick={() => setSubject(item)}
              disabled={loading}
            >
              <div style={{ fontSize: '1.4rem', marginBottom: 8 }}>
                <BookOpen size={22} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item}</div>
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <div style={{ fontWeight: 600 }}>Difficulty</div>
            {['easy', 'medium', 'hard'].map((level) => (
              <button
                key={level}
                className={`btn btn-sm ${difficulty === level ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setDifficulty(level)}
              >
                {level}
              </button>
            ))}
            <div style={{ fontWeight: 600, marginLeft: 8 }}>Count</div>
            {[5, 10, 15].map((n) => (
              <button
                key={n}
                className={`btn btn-sm ${count === n ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setCount(n)}
              >
                {n}
              </button>
            ))}
            <button
              className="btn btn-primary"
              onClick={() => handleGenerate()}
              disabled={loading}
              style={{ marginLeft: 'auto' }}
            >
              {loading ? 'Generating...' : 'Generate Questions'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const answered = answers[q?._id];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title">{subject}</h1>
            <p className="page-subtitle">{questions.length} questions loaded</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm btn-outline" onClick={() => handleGenerate(subject)} disabled={loading}>
              Regenerate
            </button>
            <button className="btn btn-sm btn-outline" onClick={() => setQuestions([])}>
              Change Subject
            </button>
          </div>
        </div>
      </div>

      {loading ? <div className="loading-screen"><div className="spinner" /></div> : !q ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📭</div>
          <h3 style={{ marginBottom: 8 }}>No questions found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Try a different subject</p>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span className="badge badge-blue">Core Subject</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{current + 1} / {questions.length}</span>
          </div>

          <h3 style={{ fontSize: '1.1rem', lineHeight: 1.6, marginBottom: 20 }}>{q.question}</h3>
          <div className="mcq-options">
            {q.options?.map((opt, i) => {
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
                </div>
              );
            })}
          </div>

          {answered && q.explanation && (
            <div className="resume-explanation" style={{ marginTop: 16 }}>
              {q.explanation}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
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
