import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../api/client';
import { FileText, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'interviewAnswers';

export default function MockInterviewPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setAnswers(JSON.parse(stored));
      } catch {
        setAnswers({});
      }
    }
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats();
        setStats(res.data);
      } catch {
        toast.error('Failed to load interview questions');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleChange = (questionText, value) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionText]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAnswers({});
    toast.success('Answers cleared');
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const questions = stats?.resume?.questions || [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title">Mock Interview</h1>
            <p className="page-subtitle">Practice answering interview questions in your own words</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={() => navigate('/resume')}>
              <FileText size={16} /> Upload Resume
            </button>
            <button className="btn btn-outline" onClick={handleClear}>
              <RefreshCcw size={16} /> Clear Answers
            </button>
          </div>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <h3 style={{ marginBottom: 8 }}>No interview questions yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Upload a resume or generate questions to begin your mock interview.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/resume')}>
            Upload Resume
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Answer these questions</h3>
          </div>
          <div className="interview-questions">
            {questions.map((q, i) => (
              <div key={`${q.question}-${i}`} className="interview-question">
                <div className="interview-question-title">
                  {i + 1}. {q.question}
                </div>
                <textarea
                  className="interview-answer"
                  rows={4}
                  placeholder="Write your answer here..."
                  value={answers[q.question] || ''}
                  onChange={(e) => handleChange(q.question, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
