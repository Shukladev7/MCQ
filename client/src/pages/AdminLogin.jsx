import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import VisionLogo from '../components/VisionLogo'

export default function AdminLogin() {
  const [form,    setForm]    = useState({ email:'', password:'' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [show,    setShow]    = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const set = (k,v) => { setError(''); setForm(p=>({...p,[k]:v})) }

  const submit = async e => {
    e.preventDefault(); setError('')
    if (!form.email || !form.password) { setError('Both fields are required.'); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      if (res.data.user.role !== 'admin') { setError('Access denied. This portal is for administrators only.'); return }
      login(res.data.token, res.data.user)
      toast.success('Welcome, Admin')
      document.documentElement.requestFullscreen().catch(() => {})
      navigate('/admin')
    } catch(err) {
      setError(err.response?.data?.message || 'Invalid credentials.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{minHeight:'100vh',background:'#0a0a0a',display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem'}}>

      <div style={{width:'100%',maxWidth:'420px'}} className="animate-fade-in">

        {/* Header */}
        <div style={{textAlign:'center',marginBottom:'2.5rem'}}>
          <div style={{display:'flex',justifyContent:'center',marginBottom:'1.5rem'}}>
            <VisionLogo size="lg" />
          </div>
          <div style={{display:'inline-flex',alignItems:'center',gap:'0.5rem',
            background:'#ffffff08',border:'1px solid #ffffff15',
            borderRadius:'999px',padding:'0.3rem 0.875rem',marginBottom:'1rem'}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'#f59e0b'}} />
            <span style={{fontSize:'0.6875rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'#a1a1a1'}}>
              Administrator Access
            </span>
          </div>
        </div>

        {/* Card */}
        <div style={{background:'#111',border:'1px solid #222',borderRadius:'16px',padding:'2rem',boxShadow:'0 8px 40px #00000080'}}>

          <div style={{marginBottom:'1.75rem'}}>
            <h2 style={{fontSize:'1.375rem',fontWeight:700,color:'#fff',letterSpacing:'-0.02em'}}>
              Admin Sign In
            </h2>
            <p style={{color:'#555',fontSize:'0.875rem',marginTop:'0.375rem'}}>
              Restricted access — authorised personnel only
            </p>
          </div>

          {error && (
            <div className="alert-error animate-fade-in" style={{marginBottom:'1.25rem'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:'1px'}}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:'1.125rem'}} noValidate>
            <div>
              <label className="label">Admin Email</label>
              <input type="email" value={form.email} onChange={e=>set('email',e.target.value)}
                className={`input ${error?'error':''}`} placeholder="admin@visioncse.com"
                autoComplete="email" autoFocus />
            </div>

            <div>
              <label className="label">Password</label>
              <div style={{position:'relative'}}>
                <input type={show?'text':'password'} value={form.password} onChange={e=>set('password',e.target.value)}
                  className={`input ${error?'error':''}`} style={{paddingRight:'4.5rem'}}
                  placeholder="Enter password" autoComplete="current-password" />
                <button type="button" onClick={()=>setShow(p=>!p)}
                  style={{position:'absolute',right:'0.875rem',top:'50%',transform:'translateY(-50%)',
                    background:'none',border:'none',color:'#555',cursor:'pointer',fontSize:'0.75rem',
                    fontWeight:600,letterSpacing:'0.04em'}}>
                  {show?'HIDE':'SHOW'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary"
              style={{width:'100%',padding:'0.875rem',marginTop:'0.25rem',fontSize:'0.9375rem'}}>
              {loading ? <><Spin/>Verifying...</> : 'Sign In to Admin Panel'}
            </button>
          </form>

          <div style={{marginTop:'1.5rem',paddingTop:'1.5rem',borderTop:'1px solid #1a1a1a',textAlign:'center'}}>
            <p style={{color:'#333',fontSize:'0.8125rem'}}>
              Not an admin?{' '}
              <Link to="/login" style={{color:'#666',textDecoration:'none'}}>
                Candidate login
              </Link>
            </p>
          </div>
        </div>

        <p style={{textAlign:'center',color:'#2a2a2a',fontSize:'0.75rem',fontFamily:'monospace',marginTop:'1.5rem'}}>
          Vision CSE · Admin Portal · Authorised Use Only
        </p>
      </div>
    </div>
  )
}

const Spin = () => (
  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
)