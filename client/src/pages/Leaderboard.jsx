import { useState, useEffect } from 'react';
import { getLeaderboard } from '../api/client';
import { Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Leaderboard() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then((res) => setData(res.data.leaderboard || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title"><Trophy size={28} style={{ marginRight: 8, color: 'var(--accent-amber)' }} /> Leaderboard</h1>
        <p className="page-subtitle">Daily rankings - top performers</p>
      </div>

      {data.length > 0 ? (
        <>
          <div className="leaderboard-podium">
            {data.slice(0, 3).map((entry, i) => (
              <div key={entry._id} className={`leaderboard-card card slide-up rank-card-${i + 1}`} style={{ animationDelay: `${i * 0.15}s` }}>
                <div className={`leaderboard-rank rank-${i + 1}`}>
                  {i + 1}
                </div>
                <LeaderboardAvatar entry={entry} size="lg" />
                <div className="leaderboard-name">{entry.name}</div>
                <div className="leaderboard-score">{entry.totalScore}</div>
                <div className="leaderboard-meta">{entry.testsCompleted} tests - Avg {entry.avgScore}%</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="table-container">
              <table className="table leaderboard-table">
                <thead><tr><th>Rank</th><th>Name</th><th>Total Score</th><th>Tests</th><th>Avg Score</th></tr></thead>
                <tbody>
                  {data.map((entry) => (
                    <tr key={entry._id} style={entry.email === user?.email ? { background: 'rgba(59,130,246,0.08)' } : {}}>
                      <td>
                        <div className={`leaderboard-rank ${entry.rank <= 3 ? `rank-${entry.rank}` : ''}`} style={entry.rank > 3 ? { background: 'var(--bg-glass)', color: 'var(--text-secondary)' } : {}}>
                          {entry.rank}
                        </div>
                      </td>
                      <td>
                        <div className="leaderboard-user-cell">
                          <LeaderboardAvatar entry={entry} />
                          <div>
                            <div className="leaderboard-table-name">
                              {entry.name} {entry.email === user?.email && <span className="badge badge-blue">You</span>}
                            </div>
                            <div className="leaderboard-table-email">{entry.email}</div>
                          </div>
                        </div>
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
          <Trophy size={48} style={{ color: 'var(--accent-amber)', marginBottom: 16 }} />
          <h3 style={{ marginBottom: 8 }}>No rankings yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Complete tests to appear on the leaderboard!</p>
        </div>
      )}
    </div>
  );
}

function LeaderboardAvatar({ entry, size = 'sm' }) {
  const label = entry.name?.charAt(0)?.toUpperCase() || 'U';

  if (entry.avatarUrl) {
    return <img className={`leaderboard-avatar ${size}`} src={entry.avatarUrl} alt={entry.name || 'User'} />;
  }

  return <div className={`leaderboard-avatar fallback ${size}`}>{label}</div>;
}
