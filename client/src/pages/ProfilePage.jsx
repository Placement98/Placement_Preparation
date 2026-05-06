import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Camera,
  CheckCircle,
  GraduationCap,
  Mail,
  MapPin,
  Save,
  Target,
  Trophy,
  Upload,
  UserRound,
} from 'lucide-react';
import { getProfile, updateProfile, uploadProfileAvatar } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const EMPTY_FORM = {
  name: '',
  headline: '',
  bio: '',
  phone: '',
  college: '',
  branch: '',
  graduationYear: '',
  location: '',
  github: '',
  linkedin: '',
  portfolio: '',
  skills: '',
};

export default function ProfilePage() {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const applyProfileResponse = useCallback((data) => {
    const nextUser = data.user;
    setProfile(nextUser);
    setStats(data.stats);
    setForm({
      name: nextUser.name || '',
      headline: nextUser.headline || '',
      bio: nextUser.bio || '',
      phone: nextUser.phone || '',
      college: nextUser.college || '',
      branch: nextUser.branch || '',
      graduationYear: nextUser.graduationYear || '',
      location: nextUser.location || '',
      github: nextUser.github || '',
      linkedin: nextUser.linkedin || '',
      portfolio: nextUser.portfolio || '',
      skills: nextUser.skills?.join(', ') || '',
    });
    updateUser(nextUser);
  }, [updateUser]);

  useEffect(() => {
    let active = true;

    getProfile()
      .then((res) => {
        if (active) applyProfileResponse(res.data);
      })
      .catch((err) => {
        if (active) toast.error(err.response?.data?.message || 'Failed to load profile');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [applyProfileResponse]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Profile picture must be under 2 MB');
      return;
    }

    setAvatarFile(file);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      toast.error('Choose a profile picture first');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      const res = await uploadProfileAvatar(formData);
      applyProfileResponse(res.data);
      setAvatarFile(null);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview('');
      toast.success('Profile picture updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await updateProfile(form);
      applyProfileResponse(res.data);
      toast.success('Profile saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const avatarSrc = avatarPreview || profile?.avatarUrl;
  const completion = getProfileCompletion(profile);
  const statCards = [
    { label: 'Total Points', value: profile?.totalScore || 0, color: 'blue', icon: <Trophy size={22} /> },
    { label: 'Tests Completed', value: profile?.testsCompleted || 0, color: 'green', icon: <Target size={22} /> },
    { label: 'Accuracy', value: `${stats?.accuracy || 0}%`, color: 'amber', icon: <CheckCircle size={22} /> },
    { label: 'Latest ATS', value: `${stats?.latestAtsScore || 0}/100`, color: 'rose', icon: <Upload size={22} /> },
  ];

  return (
    <div className="fade-in">
      <div className="page-header profile-header">
        <div>
          <span className="core-eyebrow"><UserRound size={14} /> Student Profile</span>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your placement profile, photo, links, skills, and preparation points.</p>
        </div>
        <div className="profile-completion">
          <strong>{completion}%</strong>
          <span>complete</span>
          <div className="core-progress-track"><div style={{ width: `${completion}%` }} /></div>
        </div>
      </div>

      <div className="profile-layout">
        <aside className="profile-sidebar">
          <section className="profile-card">
            <div className="profile-avatar-wrap">
              {avatarSrc ? (
                <img src={avatarSrc} alt={profile?.name || 'Profile'} className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {profile?.name?.charAt(0)?.toUpperCase() || <UserRound size={34} />}
                </div>
              )}
              <label className="profile-avatar-action">
                <Camera size={16} />
                <input type="file" accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>

            <h2>{profile?.name}</h2>
            <p>{profile?.headline || 'Add a headline for recruiters and interview prep.'}</p>

            {avatarFile && (
              <button className="btn btn-primary" onClick={handleAvatarUpload} disabled={uploading}>
                <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload Photo'}
              </button>
            )}
          </section>

          <section className="profile-card profile-info-list">
            <div><Mail size={16} /><span>{profile?.email}</span></div>
            <div><GraduationCap size={16} /><span>{profile?.college || 'College not added'}</span></div>
            <div><MapPin size={16} /><span>{profile?.location || 'Location not added'}</span></div>
          </section>
        </aside>

        <main className="profile-main">
          <div className="stats-grid profile-stats-grid">
            {statCards.map((item) => (
              <div key={item.label} className={`stat-card ${item.color}`}>
                <div className="stat-card-icon">{item.icon}</div>
                <div className="stat-card-value">{item.value}</div>
                <div className="stat-card-label">{item.label}</div>
              </div>
            ))}
          </div>

          <form className="card profile-form" onSubmit={handleSave}>
            <div className="card-header">
              <h3 className="card-title"><UserRound size={18} /> Profile Details</h3>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>

            <div className="profile-form-grid">
              <ProfileInput label="Full Name" value={form.name} onChange={(value) => handleChange('name', value)} />
              <ProfileInput label="Headline" value={form.headline} onChange={(value) => handleChange('headline', value)} placeholder="Frontend Developer | DSA Learner" />
              <ProfileInput label="Phone" value={form.phone} onChange={(value) => handleChange('phone', value)} />
              <ProfileInput label="Location" value={form.location} onChange={(value) => handleChange('location', value)} />
              <ProfileInput label="College" value={form.college} onChange={(value) => handleChange('college', value)} />
              <ProfileInput label="Branch" value={form.branch} onChange={(value) => handleChange('branch', value)} placeholder="CSE, IT, ECE..." />
              <ProfileInput label="Graduation Year" type="number" value={form.graduationYear} onChange={(value) => handleChange('graduationYear', value)} />
              <ProfileInput label="GitHub" value={form.github} onChange={(value) => handleChange('github', value)} placeholder="github.com/username" />
              <ProfileInput label="LinkedIn" value={form.linkedin} onChange={(value) => handleChange('linkedin', value)} placeholder="linkedin.com/in/username" />
              <ProfileInput label="Portfolio" value={form.portfolio} onChange={(value) => handleChange('portfolio', value)} placeholder="yourportfolio.com" />
            </div>

            <div className="form-group">
              <label className="form-label">Skills</label>
              <input
                className="form-input"
                value={form.skills}
                onChange={(event) => handleChange('skills', event.target.value)}
                placeholder="React, Node.js, MongoDB, SQL, DSA"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea
                className="form-input profile-textarea"
                value={form.bio}
                onChange={(event) => handleChange('bio', event.target.value)}
                placeholder="Write a short summary about your projects, goals, and strengths."
              />
            </div>
          </form>

          <section className="card profile-form">
            <div className="card-header">
              <h3 className="card-title"><Trophy size={18} /> Preparation Summary</h3>
            </div>
            <div className="profile-summary-grid">
              <SummaryItem label="Total submissions" value={stats?.totalSubmissions || 0} />
              <SummaryItem label="Passed submissions" value={stats?.passedSubmissions || 0} />
              <SummaryItem label="Latest score" value={`${stats?.latestScore || 0}%`} />
              <SummaryItem label="Weak topics" value={profile?.weakTopics?.length || 0} />
            </div>

            {profile?.weakTopics?.length > 0 && (
              <div className="profile-topic-block">
                <h4>Topics to improve</h4>
                <div className="topic-badges">
                  {profile.weakTopics.map((topic) => (
                    <span key={topic} className="topic-badge weak">{topic}</span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function ProfileInput({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="profile-summary-item">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function getProfileCompletion(profile) {
  if (!profile) return 0;
  const fields = [
    profile.avatarUrl,
    profile.name,
    profile.headline,
    profile.bio,
    profile.phone,
    profile.college,
    profile.branch,
    profile.graduationYear,
    profile.location,
    profile.github || profile.linkedin || profile.portfolio,
    profile.skills?.length > 0,
  ];

  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}
