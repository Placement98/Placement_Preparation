import { useState } from 'react';
import { generateCoreQuestions } from '../api/client';
import {
  BookOpen,
  Box,
  ChevronLeft,
  ChevronRight,
  Code2,
  Database,
  ListChecks,
  Network,
  RefreshCw,
  Server,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

const SUBJECTS = [
  { name: 'DBMS', icon: Database, tone: 'blue', description: 'ER models, normalization, transactions' },
  { name: 'SQL', icon: ListChecks, tone: 'green', description: 'Queries, joins, grouping, constraints' },
  { name: 'Operating Systems', icon: Server, tone: 'amber', description: 'Processes, memory, scheduling' },
  { name: 'Computer Networks', icon: Network, tone: 'cyan', description: 'OSI, TCP/IP, routing, protocols' },
  { name: 'OOP', icon: Box, tone: 'purple', description: 'Classes, inheritance, polymorphism' },
  { name: 'DSA', icon: Code2, tone: 'rose', description: 'Arrays, trees, graphs, complexity' },
  { name: 'Software Engineering', icon: BookOpen, tone: 'blue', description: 'SDLC, testing, design principles' },
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

  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(feedback).filter(Boolean).length;
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;

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
    } finally {
      setLoading(false);
    }
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
        <div className="page-header core-hero">
          <div>
            <span className="core-eyebrow"><Sparkles size={14} /> AI MCQ Practice</span>
            <h1 className="page-title">Core Subjects</h1>
            <p className="page-subtitle">Pick a CS topic, tune the difficulty, and practice fresh interview-style MCQs.</p>
          </div>
          <div className="core-hero-stat">
            <strong>{count}</strong>
            <span>{difficulty} questions</span>
          </div>
        </div>

        <div className="core-subject-grid">
          {SUBJECTS.map((item) => (
            <SubjectIconButton
              key={item.name}
              item={item}
              selected={subject === item.name}
              disabled={loading}
              onClick={() => setSubject(item.name)}
            />
          ))}
        </div>

        <div className="core-control-panel">
          <div className="core-control-group">
            <span>Difficulty</span>
            <div className="core-segmented">
              {['easy', 'medium', 'hard'].map((level) => (
                <button
                  key={level}
                  className={difficulty === level ? 'active' : ''}
                  onClick={() => setDifficulty(level)}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="core-control-group">
            <span>Count</span>
            <div className="core-segmented">
              {[5, 10, 15].map((n) => (
                <button
                  key={n}
                  className={count === n ? 'active' : ''}
                  onClick={() => setCount(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary core-generate-btn"
            onClick={() => handleGenerate()}
            disabled={loading}
          >
            {loading ? <RefreshCw size={16} className="spinning" /> : <Sparkles size={16} />}
            {loading ? 'Generating...' : 'Generate Questions'}
          </button>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const answered = answers[q?._id];

  return (
    <div className="fade-in">
      <div className="page-header core-practice-header">
        <div>
          <span className="core-eyebrow"><BookOpen size={14} /> Core Subject</span>
          <h1 className="page-title">{subject}</h1>
          <p className="page-subtitle">{questions.length} questions loaded - {difficulty} level</p>
        </div>
        <div className="core-header-actions">
          <button className="btn btn-sm btn-outline" onClick={() => handleGenerate(subject)} disabled={loading}>
            <RefreshCw size={14} /> Regenerate
          </button>
          <button className="btn btn-sm btn-outline" onClick={() => setQuestions([])}>
            Change Subject
          </button>
        </div>
      </div>

      {loading ? <div className="loading-screen"><div className="spinner" /></div> : !q ? (
        <div className="empty-state core-empty">
          <BookOpen />
          <h3>No questions found</h3>
          <p>Try a different subject or difficulty.</p>
        </div>
      ) : (
        <div className="core-practice-layout">
          <aside className="core-practice-sidebar">
            <div className="core-score-card">
              <span>Progress</span>
              <strong>{progress}%</strong>
              <div className="core-progress-track">
                <div style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="core-mini-stats">
              <div>
                <strong>{answeredCount}</strong>
                <span>Answered</span>
              </div>
              <div>
                <strong>{correctCount}</strong>
                <span>Correct</span>
              </div>
            </div>

            <div className="core-question-palette">
              {questions.map((item, index) => {
                const isAnswered = answers[item._id] !== undefined;
                const isCorrect = feedback[item._id];
                return (
                  <button
                    key={item._id || index}
                    className={[
                      index === current ? 'active' : '',
                      isAnswered ? 'answered' : '',
                      isAnswered && isCorrect ? 'correct' : '',
                      isAnswered && !isCorrect ? 'incorrect' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => setCurrent(index)}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="core-question-panel">
            <div className="core-question-topline">
              <span className="badge badge-blue">Question {current + 1}</span>
              <span>{current + 1} / {questions.length}</span>
            </div>

            <h2>{q.question}</h2>

            <div className="mcq-options">
              {q.options?.map((opt, i) => {
                const isSelected = answered === opt;
                const isCorrectOption = answered && opt === q.correctAnswer;
                const showFeedback = feedback[q._id] !== undefined;
                return (
                  <button
                    key={opt || i}
                    type="button"
                    className={[
                      'mcq-option',
                      isSelected ? 'selected' : '',
                      showFeedback && isCorrectOption ? 'correct' : '',
                      showFeedback && isSelected && !feedback[q._id] ? 'incorrect' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => !answered && checkMCQ(q._id, opt, q.correctAnswer)}
                    disabled={Boolean(answered)}
                  >
                    <div className="mcq-option-marker">{String.fromCharCode(65 + i)}</div>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {answered && q.explanation && (
              <div className="resume-explanation core-answer-note">
                {q.explanation}
              </div>
            )}

            <div className="core-question-actions">
              <button className="btn btn-outline" disabled={current === 0} onClick={() => setCurrent(current - 1)}>
                <ChevronLeft size={16} /> Previous
              </button>
              <button className="btn btn-primary" disabled={current >= questions.length - 1} onClick={() => setCurrent(current + 1)}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function SubjectIconButton({ item, selected, disabled, onClick }) {
  const Icon = item.icon;

  return (
    <button
      className={`core-subject-card ${selected ? 'selected' : ''} ${item.tone}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="core-subject-icon"><Icon size={22} /></span>
      <span className="core-subject-name">{item.name}</span>
      <span className="core-subject-description">{item.description}</span>
    </button>
  );
}
