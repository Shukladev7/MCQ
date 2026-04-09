import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import VisionLogo from './VisionLogo'

export default function Navbar({ title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const doLogout = () => {
    logout()
    navigate(user?.role === 'admin' ? '/admin/login' : '/login')
  }

  const initials = user?.name?.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase() || '?'

  return (
    <header style={{
      position:'sticky', top:0, zIndex:50,
      background:'#0a0a0a', borderBottom:'1px solid #1a1a1a',
      backdropFilter:'blur(12px)'
    }}>
      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 1.5rem',height:'56px',
        display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem'}}>

        {/* Left */}
        <div style={{display:'flex',alignItems:'center',gap:'1.25rem'}}>
          <button onClick={()=>navigate('/dashboard')} style={{background:'none',border:'none',cursor:'pointer',padding:0}}>
            <VisionLogo size="sm" />
          </button>
          {title && (
            <>
              <div style={{width:1,height:20,background:'#222'}} />
              <span style={{fontSize:'0.8125rem',color:'#555',fontWeight:500}}>{title}</span>
            </>
          )}
        </div>

        {/* User menu */}
        {user && (
          <div style={{position:'relative'}} ref={ref}>
            <button onClick={()=>setOpen(p=>!p)}
              style={{display:'flex',alignItems:'center',gap:'0.625rem',
                background:'none',border:'1px solid #222',borderRadius:'10px',
                padding:'0.375rem 0.75rem',cursor:'pointer',transition:'all 0.15s'}}>
              <div style={{width:28,height:28,borderRadius:'50%',background:'#1a1a1a',
                border:'1px solid #333',display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:'0.6875rem',fontWeight:700,color:'#fff',flexShrink:0,letterSpacing:'0.04em'}}>
                {initials}
              </div>
              <div style={{display:'none'}} className="sm:block">
                <p style={{fontSize:'0.8125rem',fontWeight:600,color:'#fff',lineHeight:1,whiteSpace:'nowrap'}}>{user.name}</p>
                <p style={{fontSize:'0.6875rem',color:'#555',lineHeight:1,marginTop:'0.2rem',fontFamily:'monospace'}}>{user.scholarNumber}</p>
              </div>
              <svg style={{color:'#444',transition:'transform 0.15s',transform:open?'rotate(180deg)':'none',flexShrink:0}}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {open && (
              <div className="animate-slide-down" style={{
                position:'absolute',right:0,top:'calc(100% + 8px)',
                width:220,background:'#111',border:'1px solid #222',
                borderRadius:12,overflow:'hidden',boxShadow:'0 8px 32px #00000080',zIndex:100
              }}>
                {/* Profile */}
                <div style={{padding:'0.875rem 1rem',borderBottom:'1px solid #1a1a1a',background:'#0f0f0f'}}>
                  <p style={{fontSize:'0.6875rem',color:'#444',fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'0.25rem'}}>Signed in as</p>
                  <p style={{fontSize:'0.875rem',fontWeight:600,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.email}</p>
                  <div style={{display:'flex',gap:'0.375rem',marginTop:'0.5rem'}}>
                    <span className="badge badge-muted">{user.branch}</span>
                    {user.role==='admin' && <span className="badge badge-warn">Admin</span>}
                  </div>
                </div>

                {/* Status */}
                {user.role !== 'admin' && (
                  <div style={{padding:'0.625rem 1rem',borderBottom:'1px solid #1a1a1a',display:'flex',flexDirection:'column',gap:'0.375rem'}}>
                    {[['MCQ Round', user.mcqSubmitted]].map(([label, done]) => (
                      <div key={label} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <span style={{fontSize:'0.75rem',color:'#555'}}>{label}</span>
                        <span className={`badge ${done?'badge-success':'badge-muted'}`}>{done?'Submitted':'Pending'}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div style={{padding:'0.375rem'}}>
                  {user.role==='admin' && (
                    <MenuBtn label="Admin Panel" icon={<GridIcon/>} onClick={()=>{navigate('/admin');setOpen(false)}} />
                  )}
                  <MenuBtn label="Dashboard" icon={<HomeIcon/>} onClick={()=>{navigate('/dashboard');setOpen(false)}} />
                  <div style={{height:1,background:'#1a1a1a',margin:'0.375rem 0'}} />
                  <MenuBtn label="Sign Out" icon={<LogoutIcon/>} onClick={doLogout} danger />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

const MenuBtn = ({label, icon, onClick, danger}) => (
  <button onClick={onClick} style={{
    width:'100%',display:'flex',alignItems:'center',gap:'0.625rem',
    padding:'0.5rem 0.75rem',borderRadius:'8px',background:'none',border:'none',
    cursor:'pointer',transition:'background 0.1s',color: danger?'#f87171':'#a1a1a1',
    fontSize:'0.8125rem',fontWeight:500,textAlign:'left'
  }}
    onMouseEnter={e=>e.currentTarget.style.background=danger?'#ef444412':'#1a1a1a'}
    onMouseLeave={e=>e.currentTarget.style.background='none'}>
    <span style={{opacity:0.7}}>{icon}</span>{label}
  </button>
)

const HomeIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
const GridIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
const LogoutIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>