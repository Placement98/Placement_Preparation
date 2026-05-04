import { useState } from 'react';
import { analyzeResume } from '../api/client';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';

export default function ResumePage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async () => {
    if (!file) {
      toast.error('Please select a resume file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await analyzeResume(formData);
      setResult(res.data.result);
      toast.success('Resume analyzed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to analyze resume');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Resume Analyzer</h1>
        <p className="page-subtitle">Upload your resume to generate tailored questions</p>
      </div>

      <div className="card resume-card">
        <div className="resume-drop">
          <Upload size={20} />
          <div>
            <div style={{ fontWeight: 600 }}>Upload Resume (PDF/DOCX/TXT)</div>
            <div className="resume-hint">Max 2 MB</div>
          </div>
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        {file && (
          <div className="resume-file">Selected: {file.name}</div>
        )}

        <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Resume'}
        </button>
      </div>

      {result && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <h3 className="card-title">Summary</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{result.summary}</p>

          <div style={{ marginTop: 20 }}>
            <h4 style={{ marginBottom: 10 }}>Key Topics</h4>
            <div className="topic-badges">
              {result.topics?.map((t) => (
                <span key={t} className="topic-badge strong">{t}</span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <h4 style={{ marginBottom: 10 }}>Suggested Questions</h4>
            <div className="resume-questions">
              {result.questions?.map((q, i) => (
                <div key={`${q.question}-${i}`} className="resume-question">
                  <div className="resume-question-meta">
                    <span className={`badge ${q.type === 'Aptitude' ? 'badge-blue' : 'badge-purple'}`}>{q.type}</span>
                    <span className="resume-difficulty">{q.difficulty}</span>
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
        </div>
      )}
    </div>
  );
}
