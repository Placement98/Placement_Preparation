import { useState, useEffect } from 'react';
import { getQuestions, generateAIQuestions, deleteQuestion, getAdminStats } from '../api/client';
import { Sparkles, Trash2, Users, FileText, Code2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const [tab, setTab] = useState('questions');
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [genForm, setGenForm] = useState({ topic: 'Arrays', type: 'Aptitude', difficulty: 'medium', count: 3 });
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [qRes, sRes] = await Promise.all([getQuestions({ limit: 100 }), getAdminStats()]);
      setQuestions(qRes.data.questions);
      setStats(sRes.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateAIQuestions(genForm);
      toast.success(res.data.message);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed. Check Gemini API key.');
    }
    setGenerating(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this question?')) return;
    try {
      await deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q._id !== id));
      toast.success('Question deleted');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-subtitle">Manage questions, view analytics, generate AI content</p>
      </div>

      {/* Overview stats */}
      {stats && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card blue"><div className="stat-card-icon"><Users size={22} /></div><div className="stat-card-value">{stats.overview?.totalUsers}</div><div className="stat-card-label">Total Users</div></div>
          <div className="stat-card green"><div className="stat-card-icon"><FileText size={22} /></div><div className="stat-card-value">{stats.overview?.totalQuestions}</div><div className="stat-card-label">Questions</div></div>
          <div className="stat-card amber"><div className="stat-card-icon"><Code2 size={22} /></div><div className="stat-card-value">{stats.overview?.totalSubmissions}</div><div className="stat-card-label">Submissions</div></div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button className={`btn ${tab === 'generate' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('generate')}><Sparkles size={16} /> AI Generate</button>
        <button className={`btn ${tab === 'questions' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('questions')}><FileText size={16} /> Questions ({questions.length})</button>
        <button className={`btn ${tab === 'users' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('users')}><Users size={16} /> Users</button>
      </div>

      {tab === 'generate' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <h3 className="card-title" style={{ marginBottom: 20 }}><Sparkles size={18} /> Generate Questions with AI</h3>
          <div className="form-group">
            <label className="form-label">Topic</label>
            <input className="form-input" value={genForm.topic} onChange={e => setGenForm({ ...genForm, topic: e.target.value })} placeholder="e.g. Arrays, Probability" />
          </div>
          <div className="grid-2" style={{ gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={genForm.type} onChange={e => setGenForm({ ...genForm, type: e.target.value })}>
                <option value="Aptitude">Aptitude (MCQ)</option>
                <option value="DSA">DSA (Coding)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select className="form-select" value={genForm.difficulty} onChange={e => setGenForm({ ...genForm, difficulty: e.target.value })}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Number of Questions (1-10)</label>
            <input className="form-input" type="number" min={1} max={10} value={genForm.count} onChange={e => setGenForm({ ...genForm, count: parseInt(e.target.value) || 1 })} />
          </div>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
            {generating ? <><RefreshCw size={16} className="spinning" /> Generating...</> : <><Sparkles size={16} /> Generate Questions</>}
          </button>
        </div>
      )}

      {tab === 'questions' && (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Type</th><th>Topic</th><th>Difficulty</th><th>Preview</th><th>AI</th><th></th></tr></thead>
              <tbody>
                {questions.map(q => (
                  <tr key={q._id}>
                    <td><span className={`badge ${q.type === 'DSA' ? 'badge-purple' : 'badge-blue'}`}>{q.type}</span></td>
                    <td>{q.topic}</td>
                    <td><span className={`badge ${q.difficulty === 'easy' ? 'badge-green' : q.difficulty === 'hard' ? 'badge-rose' : 'badge-amber'}`}>{q.difficulty}</span></td>
                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.question || q.problemStatement?.substring(0, 60)}</td>
                    <td>{q.aiGenerated ? '✨' : '—'}</td>
                    <td><button className="btn btn-sm btn-outline" style={{ color: 'var(--accent-rose)' }} onClick={() => handleDelete(q._id)}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'users' && stats?.recentUsers && (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Tests</th><th>Score</th><th>Joined</th></tr></thead>
              <tbody>
                {stats.recentUsers.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className={`badge ${u.role === 'admin' ? 'badge-rose' : 'badge-blue'}`}>{u.role}</span></td>
                    <td>{u.testsCompleted}</td>
                    <td>{u.totalScore}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
