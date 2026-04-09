import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import VisionLogo from '../components/VisionLogo'

export default function UserLogin() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  // Matrix code background decoration
  const CodeBg = () => (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div className="coding-bg">
        {Array(20).fill('const handleLogin=async(req,res)=>{\n  const auth=req.headers.authorization;\n  if(!auth)return res.status(401);\n  try{\n    const dec=jwt.verify(auth,process.env.SEC);\n    req.user=dec;\n    next();\n  }catch(e){\n    return res.status(403);\n  }\n};\n\n').join('')}
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, var(--surface) 0%, transparent 20%, transparent 80%, var(--surface) 100%)' }} />
    </div>
  )

  const set = (k, v) => { setError(''); setForm(p => ({ ...p, [k]: v })) }

  const submit = async e => {
    e.preventDefault(); setError('')
    if (!form.email.trim() || !form.password) { setError('Please enter your email and password.'); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      if (res.data.user.role === 'admin') { setError('Use the Admin Login for administrator accounts.'); return }
      login(res.data.token, res.data.user)
      toast.success(`Welcome, ${res.data.user.name.split(' ')[0]}`)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.')
    } finally { setLoading(false) }
  }

  return (
    <div className="page" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Left panel - Glassy Feature Info */}
      <div style={{ width: '45%', background: 'var(--surface)', borderRight: '1px solid var(--border)', padding: '3.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}
        className="hidden lg:flex">

        {/* Glow Effects & Animations */}
        <CodeBg />
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '60%', height: '60%', background: 'var(--gradient-glow)', filter: 'blur(100px)', opacity: 0.2, pointerEvents: 'none' }} />

        <VisionLogo size="md" style={{ position: 'relative', zIndex: 10 }} />

        <div style={{ position: 'relative', zIndex: 10 }}>
          <span className="badge" style={{ marginBottom: '1.5rem', background: 'var(--accent-dim)', color: '#fff', border: '1px solid var(--accent)' }}>Placement Assessment Platform</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.1, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
            Vision CSE<br />Recruitment 2026
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '340px' }}>
            Demonstrate your programming skills in Advanced DSA, Full Stack Web Development, and Core CS Fundamentals.
          </p>

          <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              ['Coding & Web-Dev Tracks', 'Solve complex algorithmic problems and modern Web-Dev queries.'],
              ['Strict Proctored Environment', 'Browser lock & immediate tab-switch disqualification enabled.'],
              ['Placement Guidance', 'Top performers secure prime spots in core campus recruitment.'],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', marginTop: '0.4rem', flexShrink: 0, boxShadow: '0 0 12px var(--accent)' }} />
                <div>
                  <p style={{ color: 'var(--text-1)', fontWeight: 700, fontSize: '0.9375rem' }}>{title}</p>
                  <p style={{ color: 'var(--text-3)', fontSize: '0.8125rem', marginTop: '0.125rem' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: 'var(--text-3)', fontSize: '0.75rem', fontFamily: 'JetBrains Mono,monospace', position: 'relative', zIndex: 10 }}>
          © Vision CSE Department · 2026
        </p>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', background: '#020402' }}>

        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: 'var(--gradient-glow)', filter: 'blur(100px)', opacity: 0.4, pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: '440px' }} className="animate-scale-in">
          <div className="lg:hidden" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'center' }}>
            <VisionLogo size="lg" />
          </div>

          <div className="card">
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                Welcome Back
              </h2>
              <p style={{ color: 'var(--text-2)', fontSize: '0.9375rem', marginTop: '0.5rem' }}>
                Candidate Login
              </p>
            </div>

            {error && (
              <div className="alert-error animate-slide-down" style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '1.125rem', lineHeight: 1 }}>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} noValidate>
              <div>
                <label className="label">Email Address</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  className={`input ${error ? 'error' : ''}`} placeholder="you@university.edu"
                  autoComplete="email" autoFocus />
              </div>

              <div>
                <label className="label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={show ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                    className={`input ${error ? 'error' : ''}`} style={{ paddingRight: '4.5rem' }}
                    placeholder="Enter your password" autoComplete="current-password" />
                  <button type="button" onClick={() => setShow(p => !p)}
                    style={{
                      position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '0.75rem',
                      fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'JetBrains Mono,monospace', transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
                    {show ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem', fontSize: '1rem' }}>
                {loading ? <><Spin />Authenticating...</> : 'Launch Assessment Dashboard'}
              </button>
            </form>

            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>
                New to Vision CSE?{' '}
                <Link to="/register" style={{ color: 'var(--text-1)', fontWeight: 700, textDecoration: 'none', borderBottom: '2px solid var(--accent)' }}>
                  Create an account
                </Link>
              </p>
              <p style={{ color: 'var(--text-3)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                <Link to="/admin/login" style={{ color: 'var(--text-3)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
                  Administrator Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const Spin = () => (
  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
)