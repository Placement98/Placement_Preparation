import { Link } from 'react-router-dom';
import { Code2, Brain, Trophy, BarChart3, Mail, Target, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const HERO_VIDEO = '/PixVerse_V6_Image_Text_360P_create_highly_anim.mp4';
const COMPANY_LOGOS = [
  { src: '/Capgemini_Logo_2COL_RGB.png', alt: 'Capgemini' },
  { src: '/partner-wipro-512px.png', alt: 'Wipro' },
  { src: '/images.png', alt: 'Company logo' },
  { src: '/images%20(1).png', alt: 'Company logo' },
  { src: '/channels4_profile.jpg', alt: 'Company logo' },
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <img src="/logo.png" alt="PrepNinja" className="landing-logo-img" />
            <span className="landing-logo-text">Prep<span>Ninja</span></span>
          </div>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it Works</a>
            <a href="#topics">Topics</a>
            {user ? (
              <>
                <Link to="/profile" className="btn btn-outline btn-sm">Profile</Link>
                <Link to="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline btn-sm">Sign In</Link>
                <Link to="/login" className="btn btn-primary btn-sm">Get Started Free</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-video-layer" aria-hidden="true">
          <video autoPlay muted loop playsInline preload="metadata">
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
        </div>
        <div className="landing-hero-overlay"></div>
        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <Sparkles size={14} /> AI-Powered Placement Prep
          </div>
          <h1 className="landing-hero-title">
            PrepNinja<br />
            <span className="gradient-text">Placement Prep</span>
          </h1>
          <p className="landing-hero-subtitle">
            Master DSA, Aptitude & Coding with AI-generated questions, real-time code execution, 
            and personalized practice plans. Your placement success starts here.
          </p>
          <p className="landing-hero-subtitle" style={{ fontSize: '0.95rem', marginTop: 10 }}>
            Daily assessment rules: any violation (tab switch, window change, or leaving the test) cancels the round and sets the score to 0.
          </p>
          <div className="landing-hero-cta">
            <Link to={user ? '/dashboard' : '/login'} className="btn btn-primary btn-lg">
              {user ? 'Open Dashboard' : 'Start Preparing Now'} <ChevronRight size={18} />
            </Link>
            <a href="#features" className="btn btn-outline btn-lg">
              Explore Features
            </a>
          </div>
          <div className="landing-hero-stats">
            <div className="landing-stat">
              <strong>100+</strong>
              <span>Practice Questions</span>
            </div>
            <div className="landing-stat-divider"></div>
            <div className="landing-stat">
              <strong>4</strong>
              <span>Languages Supported</span>
            </div>
            <div className="landing-stat-divider"></div>
            <div className="landing-stat">
              <strong>AI</strong>
              <span>Generated Content</span>
            </div>
          </div>
        </div>
      </section>

      {/* Placement Logos */}
      <section className="landing-logos" aria-label="Placement partners">
        <div className="landing-logos-inner">
          <p className="landing-logos-title">Our students are placed at</p>
          <div className="landing-marquee">
            <div className="landing-marquee-track">
              {[...COMPANY_LOGOS, ...COMPANY_LOGOS].map((logo, index) => (
                <div className="landing-logo-card" key={`${logo.src}-${index}`}>
                  <img src={logo.src} alt={logo.alt} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-section" id="features">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="landing-section-badge">Features</span>
            <h2>Everything You Need to Crack Placements</h2>
            <p>A complete platform designed to transform your preparation journey</p>
          </div>

          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <div className="landing-feature-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}><Brain size={24} /></div>
              <h3>AI Question Generator</h3>
              <p>Gemini AI creates tailored questions based on your weak topics. Every practice session is unique.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}><Code2 size={24} /></div>
              <h3>Online Code Editor</h3>
              <p>Write, run, and submit code in JavaScript, Python, C++, and Java with Monaco Editor.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}><Target size={24} /></div>
              <h3>Adaptive Assessments</h3>
              <p>Take timed tests mixing DSA coding and aptitude MCQs. Get auto-graded results instantly.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}><BarChart3 size={24} /></div>
              <h3>Smart Analytics</h3>
              <p>Topic-wise performance breakdown, weak area detection, and improvement tracking over time.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon" style={{ background: 'rgba(244,63,94,0.15)', color: '#f43f5e' }}><Mail size={24} /></div>
              <h3>Practice Links via Email</h3>
              <p>Get personalized practice links emailed to you automatically after every assessment.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}><Trophy size={24} /></div>
              <h3>Weekly Leaderboard</h3>
              <p>Compete with peers. Climb the ranks and track your position on the weekly leaderboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="landing-section landing-section-alt" id="how-it-works">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="landing-section-badge">How It Works</span>
            <h2>Your Path to Placement Success</h2>
            <p>A simple 4-step process that adapts to your learning pace</p>
          </div>

          <div className="landing-steps">
            <div className="landing-step">
              <div className="landing-step-number">01</div>
              <h3>Take Assessment</h3>
              <p>Start with a mixed test of DSA coding and aptitude questions to gauge your current level.</p>
            </div>
            <div className="landing-step-arrow">→</div>
            <div className="landing-step">
              <div className="landing-step-number">02</div>
              <h3>Get Analyzed</h3>
              <p>Our engine detects your weak topics and creates a personalized improvement plan.</p>
            </div>
            <div className="landing-step-arrow">→</div>
            <div className="landing-step">
              <div className="landing-step-number">03</div>
              <h3>Practice Smart</h3>
              <p>AI generates targeted questions for your weak areas. Practice with adaptive difficulty.</p>
            </div>
            <div className="landing-step-arrow">→</div>
            <div className="landing-step">
              <div className="landing-step-number">04</div>
              <h3>Track Progress</h3>
              <p>Monitor improvement on your dashboard. Compete on leaderboards. Repeat until mastery.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Topics */}
      <section className="landing-section" id="topics">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="landing-section-badge">Topics</span>
            <h2>Comprehensive Coverage</h2>
            <p>Practice across all major placement topics</p>
          </div>
          <div className="landing-topics-grid">
            {['Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs', 'Dynamic Programming', 'Sorting', 'Searching', 'Probability', 'Logical Reasoning', 'Quantitative Aptitude', 'Verbal Ability'].map((t) => (
              <div key={t} className="landing-topic-chip">
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <div className="landing-cta-inner">
          <img src="/logo.png" alt="PrepNinja" style={{ width: 80, marginBottom: 24, borderRadius: 16 }} />
          <h2>Ready to Ace Your Placements?</h2>
          <p>Join PrepNinja today and start your journey to landing your dream job.</p>
          <Link to={user ? '/dashboard' : '/login'} className="btn btn-primary btn-lg">
            {user ? 'Continue Preparing' : 'Create Free Account'} <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-logo">
            <img src="/logo.png" alt="PrepNinja" className="landing-logo-img" />
            <span className="landing-logo-text">Prep<span>Ninja</span></span>
          </div>
          <p>Train Smart. Get Placed. © {new Date().getFullYear()} PrepNinja</p>
        </div>
      </footer>
    </div>
  );
}
