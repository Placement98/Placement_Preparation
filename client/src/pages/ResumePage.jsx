import { useState } from 'react';
import { analyzeResume } from '../api/client';
import toast from 'react-hot-toast';
import { FileText, Lightbulb, MessageSquareText, Target, Upload } from 'lucide-react';

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
        <div className="resume-results">
          <section className="resume-score-panel">
            <div>
              <span className="core-eyebrow"><Target size={14} /> ATS Readiness</span>
              <div className="resume-score-value">{result.atsScore ?? 0}<span>/100</span></div>
              <p>{scoreLabel(result.atsScore ?? 0)}</p>
            </div>
          </section>

          <section className="card resume-analysis-section">
            <div className="card-header">
              <h3 className="card-title"><FileText size={18} /> Resume Summary</h3>
            </div>
            <p className="resume-summary">
              {result.summary || 'Summary is not available yet. Please analyze your resume again.'}
            </p>

            <div className="resume-topic-block">
              <h4>Key Topics</h4>
              <div className="topic-badges">
                {result.topics?.map((t) => (
                  <span key={t} className="topic-badge strong">{t}</span>
                ))}
              </div>
            </div>

            {result.atsBreakdown && (
              <div className="resume-topic-block">
                <h4>ATS Breakdown</h4>
                <div className="topic-badges">
                  {Object.entries(result.atsBreakdown).map(([key, value]) => (
                    <span key={key} className="topic-badge">
                      {key}: {value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {result.improvements?.length > 0 && (
            <section className="card resume-analysis-section">
              <div className="card-header">
                <h3 className="card-title"><Lightbulb size={18} /> Improvements</h3>
              </div>
              <div className="resume-improvement-list">
                {result.improvements.map((item, index) => (
                  <div key={item} className="resume-improvement-item">
                    <span>{index + 1}</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="card resume-analysis-section">
            <div className="card-header">
              <div>
                <h3 className="card-title"><MessageSquareText size={18} /> Questions You May Be Asked</h3>
                <p className="resume-section-subtitle">Based on the projects, skills, achievements, and gaps found in your resume.</p>
              </div>
            </div>

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
                  {q.correctAnswer && (
                    <div className="resume-correct-answer">Answer: {q.correctAnswer}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function scoreLabel(score) {
  if (score >= 80) return 'Strong resume. Focus on polishing role-specific keywords before applying.';
  if (score >= 60) return 'Good base. Add stronger metrics and tighter project details to improve shortlisting chances.';
  return 'Needs work. Prioritize sections, measurable impact, and keyword coverage first.';
}
