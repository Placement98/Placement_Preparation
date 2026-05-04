import { useState, useEffect } from 'react';
import { getLeaderboard } from '../api/client';
import { Trophy, Medal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Leaderboard() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard().then(res => setData(res.data.leaderboard || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title"><Trophy size={28} style={{ marginRight: 8, color: 'var(--accent-amber)' }} /> Leaderboard</h1>
        <p className="page-subtitle">Weekly rankings — top performers</p>
      </div>

      {data.length > 0 ? (
        <>
          {/* Top 3 podium */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}>
            {data.slice(0, 3).map((entry, i) => (
              <div key={entry._id} className="card slide-up" style={{ textAlign: 'center', padding: '32px 28px', minWidth: 180, flex: '0 1 220px', animationDelay: `${i * 0.15}s`, ...(i === 0 ? { transform: 'scale(1.05)', borderColor: 'rgba(251,191,36,0.3)' } : {}) }}>
                <div className={`leaderboard-rank rank-${i + 1}`} style={{ margin: '0 auto 12px' }}>
                  {i + 1}
                </div>
                <div className="navbar-avatar" style={{ margin: '0 auto 8px', width: 48, height: 48, fontSize: '1.1rem' }}>
                  {entry.name?.charAt(0)?.toUpperCase()}
                </div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{entry.name}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {entry.totalScore}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{entry.testsCompleted} tests · Avg {entry.avgScore}%</div>
              </div>
            ))}
          </div>

          {/* Full table */}
          <div className="card">
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Rank</th><th>Name</th><th>Total Score</th><th>Tests</th><th>Avg Score</th></tr></thead>
                <tbody>
                  {data.map((entry) => (
                    <tr key={entry._id} style={entry.email === user?.email ? { background: 'rgba(59,130,246,0.08)' } : {}}>
                      <td>
                        <div className={`leaderboard-rank ${entry.rank <= 3 ? `rank-${entry.rank}` : ''}`} style={entry.rank > 3 ? { background: 'var(--bg-glass)', color: 'var(--text-secondary)' } : {}}>
                          {entry.rank}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {entry.name} {entry.email === user?.email && <span className="badge badge-blue" style={{ marginLeft: 8 }}>You</span>}
                      </td>
                      <td style={{ fontWeight: 700 }}>{entry.totalScore}</td>
                      <td>{entry.testsCompleted}</td>
                      <td>{entry.avgScore}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🏆</div>
          <h3 style={{ marginBottom: 8 }}>No rankings yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Complete tests to appear on the leaderboard!</p>
        </div>
      )}
    </div>
  );
}
