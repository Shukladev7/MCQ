import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import VisionLogo from '../components/VisionLogo'

const Login = () => {
  const [form, setForm]     = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [error, setError]   = useState('')   // inline error banner
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setError('')   // clear error as user types
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')

    if (!form.email.trim() || !form.password.trim()) {
      setError('Please enter both email and password.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.token, res.data.user)
      toast.success(`Welcome, ${res.data.user.name.split(' ')[0]}!`)
      navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      // Always show the error — both inline and toast
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.'
      setError(msg)
      toast.error(msg, { duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg grid-bg flex items-center justify-center px-4 relative overflow-hidden">

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, #00ff8812 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, #00ff8808 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-2">
          <VisionLogo size="xl" />
          <p className="text-xs font-mono text-gray-500 tracking-widest uppercase">
            Online Assessment Portal
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{
          border: '1px solid #1f2937',
          boxShadow: '0 25px 60px #00000080, 0 0 0 1px #00ff8810'
        }}>

          <div className="mb-6">
            <h2 className="text-xl font-mono font-bold text-textPrimary">Sign In</h2>
            <p className="text-sm text-gray-500 mt-1">Enter your credentials to access the portal</p>
          </div>

          {/* ── Inline error banner ── */}
          {error && (
            <div className="mb-4 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 animate-fade-in">
              <span className="text-red-400 text-lg flex-shrink-0 mt-0.5">⚠</span>
              <p className="text-sm text-red-400 font-mono leading-snug">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="input-label">Email Address</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className={`input-field ${error ? 'border-red-500/40 focus:border-red-500/60' : ''}`}
                placeholder="admin@visioncse.com"
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  className={`input-field pr-16 ${error ? 'border-red-500/40 focus:border-red-500/60' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors text-xs font-mono tracking-wide select-none"
                >
                  {showPass ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-neon w-full py-3 mt-1"
            >
              {loading ? <><SpinIcon /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <hr className="divider mt-6" />

          <p className="text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-neon hover:underline font-semibold">
              Register here
            </Link>
          </p>
        </div>

        <p className="text-center text-gray-600 text-xs font-mono mt-6 tracking-wide">
          © Vision CSE • Recruitment Assessment Platform
        </p>
      </div>
    </div>
  )
}

const SpinIcon = () => (
  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
)

export default Login
