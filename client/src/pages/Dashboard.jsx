import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardStats, sendPracticeEmail } from '../api/client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { Target, TrendingUp, CheckCircle, AlertTriangle, Send, ChevronRight, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await getDashboardStats();
      setStats(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleSendEmail = async () => {
    try {
      const res = await sendPracticeEmail();
      toast.success(res.data.message || 'Email sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send email');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const statCards = [
    { label: 'Tests Completed', value: stats?.user?.testsCompleted || 0, color: 'blue', icon: <Target size={22} /> },
    { label: 'Accuracy', value: `${stats?.stats?.accuracy || 0}%`, color: 'green', icon: <CheckCircle size={22} /> },
    { label: 'Total Submissions', value: stats?.stats?.totalSubmissions || 0, color: 'amber', icon: <TrendingUp size={22} /> },
    { label: 'Weak Topics', value: stats?.user?.weakTopics?.length || 0, color: 'rose', icon: <AlertTriangle size={22} /> },
  ];

  const chartData = (stats?.results || []).slice(0, 10).reverse().map((r, i) => ({
    name: `Test ${i + 1}`,
    DSA: r.scores?.DSA || 0,
    Aptitude: r.scores?.Aptitude || 0,
    Overall: r.scores?.overall || 0,
  }));

  const topicData = stats?.results?.[0]?.topicScores
    ? Object.entries(typeof stats.results[0].topicScores === 'object' && stats.results[0].topicScores instanceof Map
        ? Object.fromEntries(stats.results[0].topicScores)
        : stats.results[0].topicScores
      ).map(([topic, score]) => ({ topic, score: score || 0, fullMark: 100 }))
    : [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="page-subtitle">Here's your performance overview</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={() => navigate('/test')}>
              <BookOpen size={16} /> Take Assessment
            </button>
            {stats?.user?.weakTopics?.length > 0 && (
              <button className="btn btn-primary" onClick={handleSendEmail}>
                <Send size={16} /> Email Practice Links
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div key={i} className={`stat-card ${s.color} slide-up`} style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Performance Trend</h3>
            {stats?.stats?.trend && (
              <span className={`badge ${stats.stats.trend === 'improving' ? 'badge-green' : stats.stats.trend === 'declining' ? 'badge-rose' : 'badge-amber'}`}>
                {stats.stats.trend === 'improving' ? '↗ Improving' : stats.stats.trend === 'declining' ? '↘ Declining' : '→ Stable'}
              </span>
            )}
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }} />
                <Line type="monotone" dataKey="Overall" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} />
                <Line type="monotone" dataKey="DSA" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Aptitude" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>Take your first test to see trends</p></div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Topic Analysis</h3>
          </div>
          {topicData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={topicData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="topic" stroke="#94a3b8" fontSize={11} />
                <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>No topic data yet</p></div>
          )}
        </div>
      </div>

      {stats?.user?.weakTopics?.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3 className="card-title">🔴 Weak Topics — Needs Practice</h3>
          </div>
          <div className="topic-badges">
            {stats.user.weakTopics.map((topic) => (
              <button
                key={topic}
                className="topic-badge weak"
                onClick={() => navigate(`/practice?topic=${encodeURIComponent(topic)}`)}
                style={{ cursor: 'pointer' }}
              >
                {topic} <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </div>
      )}

      {stats?.resume?.questions?.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3 className="card-title">Resume-Based Questions</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/resume')}>
              View Resume
            </button>
          </div>
          <div className="resume-questions">
            {stats.resume.questions.slice(0, 5).map((q, i) => (
              <div key={`${q.question}-${i}`} className="resume-question">
                <div className="resume-question-meta">
                  <span className={`badge ${q.type === 'Aptitude' ? 'badge-blue' : 'badge-purple'}`}>{q.type || 'Technical'}</span>
                  <span className="resume-difficulty">{q.difficulty || 'medium'}</span>
                </div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{q.question}</div>
                {q.options?.length > 0 && (
                  <ul className="resume-options">
                    {q.options.map((opt) => (
                      <li key={opt}>{opt}</li>
                    ))}
                  </ul>
                )}
                {q.explanation && (
                  <div className="resume-explanation">{q.explanation}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Submissions</h3>
        </div>
        {stats?.recentSubmissions?.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentSubmissions.map((sub) => (
                  <tr key={sub._id}>
                    <td style={{ color: 'var(--text-primary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sub.questionId?.question || sub.questionId?.problemStatement?.substring(0, 60) || 'Question'}
                    </td>
                    <td><span className={`badge ${sub.questionId?.type === 'DSA' ? 'badge-purple' : 'badge-blue'}`}>{sub.questionId?.type}</span></td>
                    <td><span className={`badge ${sub.status === 'passed' ? 'badge-green' : 'badge-rose'}`}>{sub.status}</span></td>
                    <td>{new Date(sub.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><p>No submissions yet. Take a test to get started!</p></div>
        )}
      </div>
    </div>
  );
}
