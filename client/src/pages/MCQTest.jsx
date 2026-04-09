import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api, { ROOT_URL } from '../services/api'
import { useAuth } from '../context/AuthContext'
import VisionLogo from '../components/VisionLogo'

// ── Timer ─────────────────────────────────────────────────────────────────────
function Timer({ secs, onExpire }) {
  const [left, setLeft] = useState(secs)
  const firedRef = useRef(false)

  useEffect(() => { setLeft(secs); firedRef.current = false }, [secs])
  useEffect(() => {
    const id = setInterval(() => setLeft(p => {
      if (p <= 1) { clearInterval(id); if (!firedRef.current) { firedRef.current=true; onExpire?.() } return 0 }
      return p - 1
    }), 1000)
    return () => clearInterval(id)
  }, [secs])

  const m   = Math.floor(left / 60)
  const s   = left % 60
  const pct = Math.max(0, (left / secs) * 100)
  const isDanger  = left <= 60
  const isWarning = left <= 300 && left > 60
  const color = isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#fff'

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'4px',minWidth:100}}>
      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
        <div style={{width:6,height:6,borderRadius:'50%',background:color,animation:isDanger?'countdownPulse 0.8s infinite':'none'}} />
        <span style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700,fontSize:'1.25rem',color,letterSpacing:'-0.02em',
          animation:isDanger?'countdownPulse 0.8s infinite':'none'}}>
          {String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
        </span>
      </div>
      <div style={{width:100,height:3,background:'#1a1a1a',borderRadius:99,overflow:'hidden'}}>
        <div style={{height:'100%',background:color,borderRadius:99,width:`${pct}%`,transition:'width 1s linear'}} />
      </div>
    </div>
  )
}

// ── Question Navigator ────────────────────────────────────────────────────────
function Navigator({ questions, answers, current, onGo }) {
  const answered = Object.values(answers).filter(v => v !== undefined && v !== -1).length
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
      <div>
        <p style={{fontSize:'0.6875rem',fontWeight:700,color:'#444',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'0.875rem'}}>
          Question Map
        </p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'6px'}}>
          {questions.map((q, i) => {
            const isAnswered = answers[q._id] !== undefined && answers[q._id] !== -1
            const isCurrent  = i === current
            return (
              <button key={i} onClick={() => onGo(i)}
                style={{
                  aspectRatio:'1',borderRadius:8,border:'none',cursor:'pointer',
                  fontFamily:'JetBrains Mono,monospace',fontWeight:600,fontSize:'0.75rem',
                  transition:'all 0.12s',
                  background: isCurrent ? '#fff' : isAnswered ? '#ffffff15' : '#1a1a1a',
                  color: isCurrent ? '#000' : isAnswered ? '#fff' : '#444',
                  outline: isCurrent ? '2px solid #fff' : isAnswered ? '1px solid #ffffff30' : '1px solid #222',
                  outlineOffset: isCurrent ? '2px' : 0,
                }}>
                {i+1}
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
        {[
          {color:'#fff',label:`Answered (${answered})`},
          {color:'#1a1a1a',outline:'1px solid #222',label:`Not answered (${questions.length - answered})`},
        ].map(({color,outline,label}) => (
          <div key={label} style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
            <div style={{width:12,height:12,borderRadius:3,background:color,border:outline||'1px solid #333',flexShrink:0}} />
            <span style={{fontSize:'0.75rem',color:'#555'}}>{label}</span>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.375rem'}}>
          <span style={{fontSize:'0.6875rem',color:'#444',fontWeight:600,letterSpacing:'0.04em',textTransform:'uppercase'}}>Progress</span>
          <span style={{fontSize:'0.6875rem',color:'#a1a1a1',fontFamily:'monospace'}}>{Math.round(answered/questions.length*100)}%</span>
        </div>
        <div style={{height:3,background:'#1a1a1a',borderRadius:99,overflow:'hidden'}}>
          <div style={{height:'100%',background:'#fff',borderRadius:99,transition:'width 0.4s ease',width:`${answered/questions.length*100}%`}} />
        </div>
      </div>
    </div>
  )
}

// ── Submit Modal ──────────────────────────────────────────────────────────────
function SubmitModal({ open, questions, answers, onConfirm, onCancel, submitting }) {
  if (!open) return null
  const answered = Object.values(answers).filter(v => v !== undefined && v !== -1).length
  const unanswered = questions.length - answered

  return (
    <div className="modal-backdrop">
      <div className="modal animate-scale-in">
        <h3 style={{fontSize:'1.0625rem',fontWeight:700,color:'#fff',letterSpacing:'-0.01em',marginBottom:'0.5rem'}}>Submit Assessment</h3>
        <p style={{color:'#555',fontSize:'0.875rem',marginBottom:'1.5rem'}}>Review your attempt summary before submitting.</p>

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.75rem',marginBottom:'1.25rem'}}>
          {[
            ['Answered', answered, '#fff'],
            ['Skipped', unanswered, '#555'],
            ['Total', questions.length, '#a1a1a1'],
          ].map(([label,value,color]) => (
            <div key={label} style={{background:'#0f0f0f',border:'1px solid #1a1a1a',borderRadius:10,padding:'0.875rem',textAlign:'center'}}>
              <p style={{fontSize:'1.25rem',fontWeight:800,color,fontFamily:'JetBrains Mono,monospace'}}>{value}</p>
              <p style={{fontSize:'0.6875rem',color:'#444',fontWeight:600,letterSpacing:'0.04em',textTransform:'uppercase',marginTop:'0.25rem'}}>{label}</p>
            </div>
          ))}
        </div>

        {unanswered > 0 && (
          <div className="alert-warn" style={{marginBottom:'1.25rem',fontSize:'0.8125rem'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>{unanswered} unanswered question{unanswered !== 1 ? 's' : ''} will receive zero marks. This action is irreversible.</span>
          </div>
        )}

        <div style={{display:'flex',gap:'0.75rem'}}>
          <button onClick={onCancel} disabled={submitting} className="btn btn-ghost" style={{flex:1}}>Cancel</button>
          <button onClick={onConfirm} disabled={submitting} className="btn btn-primary" style={{flex:1}}>
            {submitting ? <><Spin/>Submitting...</> : 'Confirm Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main MCQTest ──────────────────────────────────────────────────────────────
export default function MCQTest() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [questions,  setQuestions]  = useState([])
  const [answers,    setAnswers]    = useState({})
  const [current,    setCurrent]    = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [showSubmit, setShowSubmit] = useState(false)
  const [duration,   setDuration]   = useState(45*60)
  const [localSuspended, setLocalSuspended] = useState(false)
  const tabWarnings  = useRef(0)
  const saveTimer    = useRef(null)
  const autoSubmitRef= useRef(false)

  // ── Anti-cheat: tab switch ────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.requestFullscreen().catch(() => {})

    const onHide = async () => {
      if (document.hidden && !autoSubmitRef.current) {
        tabWarnings.current++
        const count = tabWarnings.current
        try { await api.post('/admin/notify/tab-violation', { userId: user?.id, count }) } catch {}

        if (count >= 1) {
          toast.error('Tab switch or unfocus detected. You have been disqualified and the test submitted.', { duration: 6000 })
          autoSubmitRef.current = true
          setTimeout(() => doSubmit(true), 2000)
        }
      }
    }
    document.addEventListener('visibilitychange', onHide)
    document.addEventListener('contextmenu', e => e.preventDefault())
    return () => { document.removeEventListener('visibilitychange', onHide) }
  }, [])

  // ── Block F5 / Ctrl+R ─────────────────────────────────────────────────────
  useEffect(() => {
    const fn = e => {
      if (e.key==='F5' || (e.ctrlKey && e.key==='r') || (e.ctrlKey && e.key==='R')) e.preventDefault()
    }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [])

  // ── Load questions ────────────────────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      try {
        const [qRes, cfgRes] = await Promise.all([
          api.get('/mcq/questions'),
          api.get('/admin/config').catch(() => ({ data: { config: null } }))
        ])
        setQuestions(qRes.data.questions)
        if (qRes.data.savedAnswers) setAnswers(qRes.data.savedAnswers)
        if (cfgRes.data.config?.mcqDuration) setDuration(cfgRes.data.config.mcqDuration * 60)
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load questions')
        navigate('/dashboard')
      } finally { setLoading(false) }
    })()
  }, [])

  // ── Auto-save every 30s ───────────────────────────────────────────────────
  useEffect(() => {
    if (!questions.length || submitted) return
    saveTimer.current = setInterval(() => saveAnswers(answers), 30000)
    return () => clearInterval(saveTimer.current)
  }, [answers, questions, submitted])

  const saveAnswers = async (ans) => {
    try { await api.post('/mcq/save', { answers: ans }) } catch {}
  }

  const doSubmit = useCallback(async (auto = false) => {
    if (submitted || submitting) return
    setSubmitting(true)
    setShowSubmit(false)
    if (auto) setLocalSuspended(true)
    try {
      await saveAnswers(answers)
      await api.post('/mcq/submit', { answers, suspended: auto })
      setSubmitted(true)
      toast.success(auto ? 'Suspended due to test violations.' : 'Assessment submitted successfully.')
      setTimeout(() => navigate('/dashboard'), 2500)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.')
      setSubmitting(false)
    }
  }, [answers, submitted, submitting])

  const handleAnswer = (qId, idx) => {
    setAnswers(p => {
      const next = { ...p, [qId]: idx }
      return next
    })
  }

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#0a0a0a',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'1rem'}}>
        <div style={{width:28,height:28,border:'2px solid #222',borderTopColor:'#fff',borderRadius:'50%'}} className="animate-spin" />
        <p style={{color:'#333',fontSize:'0.8125rem',fontFamily:'monospace'}}>Loading questions...</p>
      </div>
    </div>
  )

  if (submitted) return (
    <div style={{minHeight:'100vh',background:'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',maxWidth:400,padding:'2rem'}} className="animate-fade-in card">
        <div style={{width:56,height:56,borderRadius:'50%',
          background: localSuspended ? 'rgba(244,63,94,0.15)' : '#ffffff10',
          border: `1px solid ${localSuspended ? 'rgba(244,63,94,0.4)' : 'rgba(255,255,255,0.2)'}`,
          display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1.5rem',
          boxShadow: localSuspended ? '0 0 20px rgba(244,63,94,0.2)' : 'none'}}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={localSuspended ? '#f43f5e' : '#fff'} strokeWidth="2.5">
            {localSuspended 
              ? <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/> 
              : <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></>}
          </svg>
        </div>
        <h2 style={{fontSize:'1.375rem',fontWeight:700,color: localSuspended ? '#f43f5e' : '#fff',letterSpacing:'-0.02em',marginBottom:'0.625rem'}}>
          {localSuspended ? 'Assessment Suspended' : 'Assessment Submitted'}
        </h2>
        <p style={{color: localSuspended ? '#fca5a5' : 'var(--text-2)',fontSize:'0.9375rem',lineHeight:1.6,marginBottom:'1.5rem'}}>
          {localSuspended 
            ? 'Your account has been permanently flagged for tab-switching violations and your session was terminated.' 
            : 'Your responses have been recorded. Results will be reviewed by the admin and are not visible to candidates.'}
        </p>
        <p style={{color:'var(--text-3)',fontSize:'0.8125rem',fontFamily:'monospace'}}>Redirecting to dashboard...</p>
      </div>
    </div>
  )

  const q = questions[current]
  const answered = Object.values(answers).filter(v => v !== undefined && v !== -1).length

  return (
    <div style={{minHeight:'100vh',background:'#0a0a0a',display:'flex',flexDirection:'column'}}
      onContextMenu={e=>e.preventDefault()}>

      {/* ── Header ── */}
      <header style={{position:'sticky',top:0,zIndex:50,background:'#0a0a0a',borderBottom:'1px solid #1a1a1a'}}>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'0 1.5rem',height:56,
          display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem'}}>
          <VisionLogo size="sm" />

          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}}>
            <span style={{fontSize:'0.6875rem',color:'#444',fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase'}}>
              MCQ Assessment
            </span>
            <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
              <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.8125rem',color:'#a1a1a1'}}>
                {current+1} / {questions.length}
              </span>
              <span style={{color:'#222'}}>|</span>
              <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.8125rem',color:'#555'}}>
                {answered} answered
              </span>
            </div>
          </div>

          <Timer secs={duration} onExpire={() => doSubmit(true)} />
        </div>

        {/* Progress bar */}
        <div style={{height:2,background:'#111'}}>
          <div style={{height:'100%',background:'#fff',transition:'width 0.4s ease',width:`${answered/questions.length*100}%`}} />
        </div>
      </header>

      {/* Tab warning banner */}
      {tabWarnings.current > 0 && (
        <div style={{background:'#1a0000',borderBottom:'1px solid #ef444430',padding:'0.625rem 1.5rem',
          display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span style={{fontSize:'0.8125rem',color:'#f87171',fontWeight:500}}>
            Tab violation — {tabWarnings.current}/3 warnings. {3 - tabWarnings.current} remaining before auto-submit.
          </span>
        </div>
      )}

      {/* ── Body ── */}
      <div style={{flex:1,maxWidth:1280,margin:'0 auto',width:'100%',padding:'1.5rem',display:'flex',gap:'1.5rem',alignItems:'flex-start'}}>

        {/* Question */}
        <main style={{flex:1,minWidth:0}}>
          {q && (
            <div style={{background:'#111',border:'1px solid #1a1a1a',borderRadius:14,overflow:'hidden'}} className="animate-fade-in">

              {/* Q header */}
              <div style={{padding:'1.25rem 1.5rem',borderBottom:'1px solid #1a1a1a',background:'#0f0f0f',
                display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.875rem'}}>
                  <div style={{width:32,height:32,borderRadius:8,background:'#1a1a1a',border:'1px solid #222',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontFamily:'JetBrains Mono,monospace',fontWeight:700,fontSize:'0.8125rem',color:'#fff',flexShrink:0}}>
                    {current+1}
                  </div>
                  <span style={{fontSize:'0.6875rem',color:'#444',fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase'}}>
                    Question {current+1} of {questions.length}
                  </span>
                </div>
                {answers[q._id] !== undefined && answers[q._id] !== -1 && (
                  <div style={{display:'flex',alignItems:'center',gap:'0.375rem'}}>
                    <div className="dot dot-done" />
                    <span style={{fontSize:'0.75rem',color:'#a1a1a1',fontWeight:500}}>Answered</span>
                  </div>
                )}
              </div>

              {/* Q content */}
              <div style={{padding:'1.5rem'}}>
                <p style={{fontSize:'1rem',color:'#e5e5e5',lineHeight:1.75,marginBottom:'1.5rem',fontWeight:400}}>
                  {q.questionText}
                </p>

                {q.questionImage && (
                  <div style={{marginBottom:'1.5rem',borderRadius:10,overflow:'hidden',border:'1px solid #222',background:'#0f0f0f',
                    display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
                    <img src={`${ROOT_URL}${q.questionImage}`} alt="Question"
                      style={{maxWidth:'100%',maxHeight:320,objectFit:'contain',borderRadius:6}} />
                  </div>
                )}

                {/* Options */}
                <div style={{display:'flex',flexDirection:'column',gap:'0.625rem'}}>
                  {q.options.map((opt, i) => {
                    const isSelected = answers[q._id] === i
                    return (
                      <button key={i} onClick={() => handleAnswer(q._id, i)}
                        style={{
                          display:'flex',alignItems:'center',gap:'1rem',
                          padding:'1rem 1.25rem',borderRadius:10,cursor:'pointer',
                          border: isSelected ? '1px solid #fff' : '1px solid #1a1a1a',
                          background: isSelected ? '#ffffff10' : '#0f0f0f',
                          textAlign:'left',transition:'all 0.12s',
                        }}
                        onMouseEnter={e=>{ if(!isSelected) { e.currentTarget.style.borderColor='#333'; e.currentTarget.style.background='#141414' } }}
                        onMouseLeave={e=>{ if(!isSelected) { e.currentTarget.style.borderColor='#1a1a1a'; e.currentTarget.style.background='#0f0f0f' } }}>
                        <div style={{
                          width:22,height:22,borderRadius:'50%',flexShrink:0,
                          border: isSelected ? '2px solid #fff' : '1px solid #333',
                          background: isSelected ? '#fff' : 'transparent',
                          display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.12s'
                        }}>
                          {isSelected && <div style={{width:8,height:8,borderRadius:'50%',background:'#000'}} />}
                        </div>
                        <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.75rem',
                          color: isSelected ? '#fff' : '#555', fontWeight:700, flexShrink:0}}>
                          {String.fromCharCode(65+i)}
                        </span>
                        <span style={{fontSize:'0.9375rem',color: isSelected ? '#fff' : '#a1a1a1',lineHeight:1.5}}>
                          {opt}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {answers[q._id] !== undefined && answers[q._id] !== -1 && (
                  <button onClick={() => { const n={...answers}; delete n[q._id]; setAnswers(n) }}
                    style={{marginTop:'1rem',background:'none',border:'none',color:'#444',cursor:'pointer',
                      fontSize:'0.8125rem',display:'flex',alignItems:'center',gap:'0.375rem',transition:'color 0.1s'}}
                    onMouseEnter={e=>e.currentTarget.style.color='#f87171'}
                    onMouseLeave={e=>e.currentTarget.style.color='#444'}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    Clear response
                  </button>
                )}
              </div>

              {/* Navigation */}
              <div style={{padding:'1rem 1.5rem',borderTop:'1px solid #1a1a1a',background:'#0f0f0f',
                display:'flex',alignItems:'center',justifyContent:'space-between',gap:'0.75rem'}}>
                <button onClick={() => setCurrent(p => Math.max(0, p-1))} disabled={current===0}
                  className="btn btn-ghost" style={{minWidth:96}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                  Previous
                </button>

                {current < questions.length - 1 ? (
                  <button onClick={() => setCurrent(p => Math.min(questions.length-1, p+1))}
                    className="btn btn-primary" style={{minWidth:96}}>
                    Next
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                ) : (
                  <button onClick={() => setShowSubmit(true)} disabled={submitting}
                    className="btn btn-primary" style={{minWidth:120}}>
                    Submit Test
                  </button>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside style={{width:240,flexShrink:0,position:'sticky',top:72}}
          className="hidden lg:block">
          <div style={{background:'#111',border:'1px solid #1a1a1a',borderRadius:14,padding:'1.25rem'}}>
            <Navigator questions={questions} answers={answers} current={current} onGo={setCurrent} />
            <div style={{marginTop:'1.25rem',paddingTop:'1.25rem',borderTop:'1px solid #1a1a1a'}}>
              <button onClick={() => setShowSubmit(true)} disabled={submitting}
                className="btn btn-primary" style={{width:'100%'}}>
                Submit Test
              </button>
            </div>
          </div>
        </aside>
      </div>

      <SubmitModal
        open={showSubmit}
        questions={questions}
        answers={answers}
        submitting={submitting}
        onConfirm={() => doSubmit(false)}
        onCancel={() => setShowSubmit(false)}
      />
    </div>
  )
}

const Spin = () => (
  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
)