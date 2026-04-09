import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import VisionLogo from '../components/VisionLogo'

const BRANCHES = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE', 'Other']

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', scholarNumber: '', branch: 'CSE', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
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

  const set = (k, v) => { setErrors(p => ({ ...p, [k]: '' })); setError(''); setForm(p => ({ ...p, [k]: v })) }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name required'
    if (!form.email.includes('@')) e.email = 'Valid email required'
    if (!form.scholarNumber.trim()) e.scholarNumber = 'Scholar number required'
    if (form.password.length < 6) e.password = 'Minimum 6 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setLoading(true)
    try {
      const res = await api.post('/auth/register', form)
      login(res.data.token, res.data.user)
      toast.success('Account created! Welcome.')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Left panel */}
      <div style={{ width: '45%', background: 'var(--surface)', borderRight: '1px solid var(--border)', padding: '3.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}
        className="hidden lg:flex">

        {/* Glow Effects & Animations */}
        <CodeBg />
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '60%', height: '60%', background: 'var(--gradient-glow)', filter: 'blur(100px)', opacity: 0.2, pointerEvents: 'none' }} />

        <VisionLogo size="md" style={{ position: 'relative', zIndex: 10 }} />

        <div style={{ position: 'relative', zIndex: 10 }}>
          <span className="badge" style={{ marginBottom: '1.5rem', background: 'var(--accent-dim)', color: '#fff', border: '1px solid var(--accent)' }}>Join the Process</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.1, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
            Create your<br />Candidate Account
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '340px' }}>
            Register to participate in Vision CSE Recruitment. Complete both Web Dev and DSA rounds to be considered for Placements.
          </p>

          <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              { label: 'Scholar Number Verification', desc: 'Accounts are bound to university ID' },
              { label: 'Multi-Disciplinary Assessment', desc: 'Coding, Web Dev, DSA & Placements' },
              { label: 'Email Security', desc: 'Mandatory verification link will be provided to authenticate login.' },
            ].map(i => (
              <div key={i.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', marginTop: '0.4rem', flexShrink: 0, boxShadow: '0 0 12px var(--accent)' }} />
                <div>
                  <p style={{ color: 'var(--text-1)', fontWeight: 700, fontSize: '0.9375rem' }}>{i.label}</p>
                  <p style={{ color: 'var(--text-3)', fontSize: '0.8125rem', marginTop: '0.125rem' }}>{i.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: 'var(--text-3)', fontSize: '0.75rem', fontFamily: 'JetBrains Mono,monospace', position: 'relative', zIndex: 10 }}>
          © Vision CSE Department · 2026
        </p>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '3rem 2rem', position: 'relative', overflowY: 'auto', maxHeight: '100vh', background: '#020402' }}>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: 'var(--gradient-glow)', filter: 'blur(100px)', opacity: 0.4, pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: '480px' }} className="animate-scale-in">
          <div className="lg:hidden" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'center' }}>
            <VisionLogo size="lg" />
          </div>

          <div className="card">
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                Register
              </h2>
              <p style={{ color: 'var(--text-2)', fontSize: '0.9375rem', marginTop: '0.5rem' }}>
                Fill in your details to create a candidate profile
              </p>
            </div>

            {error && (
              <div className="alert-error animate-slide-down" style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '1.125rem', lineHeight: 1 }}>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} noValidate>

              <div>
                <label className="label">Full Name</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  className={`input ${errors.name ? 'error' : ''}`} placeholder="Rahul Sharma" autoFocus />
                {errors.name && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.375rem', fontFamily: 'JetBrains Mono,monospace' }}>{errors.name}</p>}
              </div>

              <div>
                <label className="label">Email Address</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  className={`input ${errors.email ? 'error' : ''}`} placeholder="you@university.edu" autoComplete="email" />
                {errors.email && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.375rem', fontFamily: 'JetBrains Mono,monospace' }}>{errors.email}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Scholar Number</label>
                  <input value={form.scholarNumber} onChange={e => set('scholarNumber', e.target.value)}
                    className={`input ${errors.scholarNumber ? 'error' : ''}`} style={{ fontFamily: 'JetBrains Mono,monospace' }} placeholder="0801CS211001" />
                  {errors.scholarNumber && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.375rem', fontFamily: 'JetBrains Mono,monospace' }}>{errors.scholarNumber}</p>}
                </div>
                <div>
                  <label className="label">Branch</label>
                  <select value={form.branch} onChange={e => set('branch', e.target.value)}
                    className="input" style={{ cursor: 'pointer', appearance: 'none' }}>
                    {BRANCHES.map(b => <option key={b} value={b} style={{ background: '#1a1a1a' }}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                      className={`input ${errors.password ? 'error' : ''}`} style={{ paddingRight: '4rem' }} placeholder="Min. 6 chars" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      style={{
                        position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '0.75rem',
                        fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'JetBrains Mono,monospace', transition: 'color 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
                      {showPass ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>
                  {errors.password && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.375rem', fontFamily: 'JetBrains Mono,monospace' }}>{errors.password}</p>}
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input type={showPass ? 'text' : 'password'} value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                    className={`input ${errors.confirmPassword ? 'error' : ''}`} placeholder="Repeat password" autoComplete="new-password" />
                  {errors.confirmPassword && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.375rem', fontFamily: 'JetBrains Mono,monospace' }}>{errors.confirmPassword}</p>}
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem', fontSize: '1rem' }}>
                {loading ? <><Spinner />Creating account...</> : 'Create Candidate Account'}
              </button>
            </form>

            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>
                Already registered?{' '}
                <Link to="/login" style={{ color: 'var(--text-1)', fontWeight: 700, textDecoration: 'none', borderBottom: '2px solid var(--accent)' }}>
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const Spinner = () => (
  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)
