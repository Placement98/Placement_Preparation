import { useState, useEffect } from 'react';
import { getHistory } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function ResultsPage() {
  const [data, setData] = useState({ results: [], recentSubmissions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory().then(res => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const chartData = data.results.slice(0, 10).reverse().map((r, i) => ({
    name: `#${i + 1}`,
    DSA: r.scores?.DSA || 0,
    Aptitude: r.scores?.Aptitude || 0,
  }));

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Results & Analytics</h1>
        <p className="page-subtitle">Your performance history</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><h3 className="card-title"><TrendingUp size={18} style={{ marginRight: 8 }} /> Score Breakdown</h3></div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }} />
              <Bar dataKey="DSA" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Aptitude" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state"><p>No results yet</p></div>
        )}
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">Test History</h3></div>
        {data.results.length > 0 ? (
          <div className="table-container">
            <table className="table results-table">
              <thead><tr><th>Date</th><th>Type</th><th>Overall</th><th>DSA</th><th>Aptitude</th><th>Correct</th><th>Weak Topics</th></tr></thead>
              <tbody>
                {data.results.map((r) => (
                  <tr key={r._id}>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td><span className="badge badge-blue">{r.testType}</span></td>
                    <td style={{ fontWeight: 700, color: r.scores?.overall >= 70 ? 'var(--accent-emerald)' : r.scores?.overall >= 40 ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>{r.scores?.overall}%</td>
                    <td>{r.scores?.DSA}%</td>
                    <td>{r.scores?.Aptitude}%</td>
                    <td>{r.correctAnswers}/{r.totalQuestions}</td>
                    <td>
                      <div className="topic-badges" style={{ gap: 4 }}>
                        {r.weakTopics?.map(t => <span key={t} className="topic-badge weak" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{t}</span>)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><p>Complete a test to see results here</p></div>
        )}
      </div>
    </div>
  );
}
