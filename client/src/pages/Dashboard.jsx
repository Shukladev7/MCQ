import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import socket, { connectSocket } from '../services/socket'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

// ── Countdown ─────────────────────────────────────────────────────────────────
function Countdown({ target, label, danger }) {
  const [diff, setDiff] = useState(Math.max(0, new Date(target) - Date.now()))
  useEffect(() => {
    const id = setInterval(() => setDiff(Math.max(0, new Date(target) - Date.now())), 500)
    return () => clearInterval(id)
  }, [target])

  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)

  const units = []
  if (d > 0) units.push([d, 'D'])
  units.push([h,'H'], [m,'M'], [s,'S'])

  const color = danger && diff < 300000 ? '#ef4444' : diff < 600000 ? '#f59e0b' : '#fff'

  return (
    <div style={{display:'flex',alignItems:'center',gap:'0.375rem'}}>
      {units.map(([v, u], i) => (
        <span key={u}>
          <span style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700,fontSize:'1rem',color,letterSpacing:'-0.02em',
            animation: diff < 60000 ? 'countdownPulse 1s infinite' : 'none'}}>
            {String(v).padStart(2,'0')}
          </span>
          <span style={{fontSize:'0.6875rem',color:'#555',fontWeight:500,marginLeft:'1px'}}>{u}</span>
          {i < units.length-1 && <span style={{color:'#333',margin:'0 1px'}}>:</span>}
        </span>
      ))}
    </div>
  )
}

// ── Modal ────────────────────────────────────────────────────────────────────
function Modal({ open, title, message, confirmLabel, onConfirm, onCancel, danger }) {
  if (!open) return null
  return (
    <div className="modal-backdrop">
      <div className="modal animate-scale-in">
        <h3 style={{fontSize:'1.0625rem',fontWeight:700,color:'#fff',letterSpacing:'-0.01em',marginBottom:'0.625rem'}}>
          {title}
        </h3>
        <p style={{color:'#666',fontSize:'0.875rem',lineHeight:1.6}}>{message}</p>
        <div style={{display:'flex',gap:'0.75rem',marginTop:'1.5rem'}}>
          <button onClick={onCancel} className="btn btn-ghost" style={{flex:1}}>Cancel</button>
          <button onClick={onConfirm} className={`btn ${danger?'btn-danger':'btn-primary'}`} style={{flex:1}}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, refreshUser } = useAuth()
  const [config, setConfig]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null) // { title, message, confirm, action }
  const [now, setNow]         = useState(Date.now())
  const navigate = useNavigate()

  // Clock tick to evaluate test live status
  useEffect(() => {
    const clockId = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(clockId)
  }, [])

  // Real-time config sync via socket
  useEffect(() => {
    connectSocket(user?.id)
    socket.on('config:update', (newConfig) => {
      setConfig(newConfig)
      toast('Schedule updated by admin', { icon: '📋', style:{ background:'#111',color:'#fff',border:'1px solid #222' } })
    })
    return () => socket.off('config:update')
  }, [user])

  useEffect(() => {
    ;(async () => {
      try {
        await refreshUser()
        const r = await api.get('/admin/config')
        setConfig(r.data.config)
      } catch { /* config may not exist */ }
      finally { setLoading(false) }
    })()
  }, [])

  const start = config?.mcqStartTime ? new Date(config.mcqStartTime) : null
  const end   = config?.mcqEndTime   ? new Date(config.mcqEndTime)   : null
  const isLive     = start && end && now >= start && now <= end
  const isUpcoming = start && now < start
  const isOver     = end && now > end

  const handleStart = () => {
    if (user.mcqSubmitted) return
    setModal({
      title: 'Start MCQ Assessment',
      message: `You are about to begin the MCQ round. The test has ${config?.mcqQuestionCount || 30} questions and ${config?.mcqDuration || 45} minutes. Once started, the timer cannot be paused. Switching tabs or opening external windows will result in immediate disqualification.`,
      confirm: 'Start Test',
      action: () => navigate('/test/mcq')
    })
  }

  const fmtTime = d => d ? new Date(d).toLocaleString('en-IN', {
    day:'2-digit', month:'short', year:'numeric',
    hour:'2-digit', minute:'2-digit', hour12:true
  }) : '—'

  const Status = () => {
    if (user?.isSuspended) return <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}><div className="dot" style={{background:'#f43f5e'}}/ ><span style={{fontSize:'0.8125rem',color:'#f43f5e',fontWeight:500}}>Suspended</span></div>
    if (user?.mcqSubmitted) return <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}><div className="dot dot-done" /><span style={{fontSize:'0.8125rem',color:'#fff',fontWeight:500}}>Submitted</span></div>
    if (!start) return <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}><div className="dot dot-off" /><span style={{fontSize:'0.8125rem',color:'#555'}}>Awaiting Schedule</span></div>
    if (isLive) return <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}><div className="dot dot-live" /><span style={{fontSize:'0.8125rem',color:'#22c55e',fontWeight:500}}>Live Now</span></div>
    if (isUpcoming) return <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}><div className="dot dot-pending" /><span style={{fontSize:'0.8125rem',color:'#f59e0b',fontWeight:500}}>Scheduled</span></div>
    return <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}><div className="dot dot-off" /><span style={{fontSize:'0.8125rem',color:'#555'}}>Ended</span></div>
  }

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#0a0a0a',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'1rem'}}>
        <div style={{width:32,height:32,border:'2px solid #222',borderTopColor:'#fff',borderRadius:'50%'}} className="animate-spin" />
        <p style={{color:'#333',fontFamily:'monospace',fontSize:'0.8125rem'}}>Loading portal...</p>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#0a0a0a'}}>
      <Navbar />
      <main style={{maxWidth:'960px',margin:'0 auto',padding:'2.5rem 1.5rem'}}>

        {/* Welcome */}
        <div style={{marginBottom:'2.5rem'}}>
          <p style={{fontSize:'0.75rem',color:'#444',fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'0.5rem'}}>Welcome back</p>
          <h1 style={{fontSize:'1.875rem',fontWeight:800,color:'#fff',letterSpacing:'-0.03em',lineHeight:1.2}}>
            {user?.name}
          </h1>
          <p style={{color:'#555',fontSize:'0.9375rem',marginTop:'0.375rem',fontFamily:'monospace'}}>
            {user?.branch} · {user?.scholarNumber}
          </p>
        </div>

        {/* MCQ Test Card */}
        <div style={{background:'#111',border:'1px solid #222',borderRadius:16,overflow:'hidden',marginBottom:'1.5rem'}}>

          {/* Header strip */}
          <div style={{padding:'1.25rem 1.5rem',borderBottom:'1px solid #1a1a1a',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem',background:'#0f0f0f'}}>
            <div>
              <p style={{fontSize:'0.6875rem',color:'#444',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'0.25rem'}}>Assessment</p>
              <h2 style={{fontSize:'1.125rem',fontWeight:700,color:'#fff',letterSpacing:'-0.01em'}}>MCQ Round</h2>
            </div>
            <Status />
          </div>

          {/* Body */}
          <div style={{padding:'1.5rem'}}>

            {/* Meta row */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem',marginBottom:'1.5rem'}}>
              {[
                ['Questions', config?.mcqQuestionCount || '—'],
                ['Duration', config?.mcqDuration ? `${config.mcqDuration} min` : '—'],
                ['Scoring', '+4 / −1'],
              ].map(([label, value]) => (
                <div key={label} style={{background:'#0f0f0f',border:'1px solid #1a1a1a',borderRadius:10,padding:'0.875rem 1rem'}}>
                  <p style={{fontSize:'0.6875rem',color:'#444',fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'0.375rem'}}>{label}</p>
                  <p style={{fontSize:'1rem',fontWeight:700,color:'#fff',fontFamily:'JetBrains Mono,monospace'}}>{value}</p>
                </div>
              ))}
            </div>

            {/* Schedule */}
            {start ? (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1.5rem'}}>
                {[['Start', fmtTime(start)], ['End', fmtTime(end)]].map(([lbl,val]) => (
                  <div key={lbl} style={{background:'#0f0f0f',border:'1px solid #1a1a1a',borderRadius:10,padding:'0.875rem 1rem'}}>
                    <p style={{fontSize:'0.6875rem',color:'#444',fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'0.375rem'}}>{lbl}</p>
                    <p style={{fontSize:'0.8125rem',color:'#a1a1a1',fontFamily:'JetBrains Mono,monospace'}}>{val}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert-info" style={{marginBottom:'1.5rem'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <span>The test schedule has not been published yet. This page will update automatically when the admin sets the schedule.</span>
              </div>
            )}

            {/* Countdown banners */}
            {isUpcoming && (
              <div style={{background:'#0f0f0f',border:'1px solid #222',borderRadius:10,padding:'1rem 1.25rem',
                display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem',flexWrap:'wrap',gap:'0.75rem'}}>
                <div>
                  <p style={{fontSize:'0.6875rem',color:'#555',fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'0.25rem'}}>Starts in</p>
                  <Countdown target={start} />
                </div>
                <span className="badge badge-warn">Upcoming</span>
              </div>
            )}

            {isLive && !user?.mcqSubmitted && (
              <div style={{background:'#ffffff08',border:'1px solid #ffffff15',borderRadius:10,padding:'1rem 1.25rem',
                display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem',flexWrap:'wrap',gap:'0.75rem'}}>
                <div>
                  <p style={{fontSize:'0.6875rem',color:'#555',fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'0.25rem'}}>Time Remaining</p>
                  <Countdown target={end} danger />
                </div>
                <span className="badge badge-white">Live Now</span>
              </div>
            )}

            {user?.isSuspended && (
              <div className="alert-error" style={{marginBottom:'1.5rem',borderColor:'rgba(244,63,94,0.3)',background:'rgba(244,63,94,0.1)'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}>
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <div>
                  <p style={{fontWeight:600,color:'#f43f5e'}}>Account Permanently Suspended</p>
                  <p style={{color:'#fca5a5',fontSize:'0.8125rem',marginTop:'0.125rem'}}>You have been flagged for repeated testing violations. Contact administration.</p>
                </div>
              </div>
            )}

            {!user?.isSuspended && user?.mcqSubmitted && (
              <div className="alert-info" style={{marginBottom:'1.5rem',borderColor:'#ffffff15',background:'#ffffff08'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}>
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
                <div>
                  <p style={{fontWeight:600,color:'#fff'}}>Test submitted successfully</p>
                  <p style={{color:'#555',fontSize:'0.8125rem',marginTop:'0.125rem'}}>Results are under admin review and will not be displayed to candidates.</p>
                </div>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleStart}
              disabled={!isLive || !!user?.mcqSubmitted || !!user?.isSuspended}
              className="btn btn-primary"
              style={{width:'100%',padding:'0.875rem',fontSize:'0.9375rem'}}>
              {user?.isSuspended ? 'Suspended'
                : user?.mcqSubmitted ? 'Submitted'
                : isOver ? 'Test has ended'
                : isLive ? 'Begin Assessment'
                : 'Not available yet'}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div style={{background:'#050805',border:'1px solid #1a1a1a',borderRadius:14,padding:'1.75rem',marginTop:'1.5rem', boxShadow:'0 10px 40px rgba(0,0,0,0.5)'}}>
          <h3 style={{fontSize:'1rem',fontWeight:700,color:'#fff',letterSpacing:'-0.01em',marginBottom:'1.25rem',display:'flex',alignItems:'center',gap:'0.5rem'}}>
            <div style={{width:8,height:8,background:'var(--accent)',borderRadius:'50%'}}></div> Assessment Guidelines
          </h3>
          <div style={{display:'grid',gap:'1rem'}}>
            {[
              ['Marking Scheme', 'Each correct answer awards +4 marks. Each incorrect answer deducts 1 mark. Unattempted questions carry no penalty.'],
              ['Strict Tab Monitoring', 'Switching to another browser tab or window, or losing window focus, will result in immediate disqualification. Administrator will be flagged automatically.'],
              ['Auto-save', 'Your answers are automatically saved every 30 seconds. You can also navigate freely between questions.'],
              ['Schedule Sync', 'The test schedule updates in real time. If the admin modifies the timing, your page will reflect it immediately without a refresh.'],
            ].map(([title, desc]) => (
              <div key={title} style={{display:'flex',gap:'1rem',alignItems:'flex-start',background:'#0a0e0a',padding:'1rem',borderRadius:8,border:'1px solid #111'}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:'var(--accent)',marginTop:'0.4rem',flexShrink:0}} />
                <div>
                  <span style={{fontWeight:700,color:'#00ff66',fontSize:'0.875rem',letterSpacing:'0.02em'}}>{title} — </span>
                  <span style={{color:'#a1a1a1',fontSize:'0.875rem',lineHeight:1.6}}>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Start confirmation modal */}
      {modal && (
        <Modal
          open={!!modal}
          title={modal.title}
          message={modal.message}
          confirmLabel={modal.confirm}
          onConfirm={() => { setModal(null); modal.action() }}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  )
}