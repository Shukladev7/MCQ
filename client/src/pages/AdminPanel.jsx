import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api, { ROOT_URL } from '../services/api'
import { useAuth } from '../context/AuthContext'
import VisionLogo from '../components/VisionLogo'
import socket, { connectAdminSocket } from '../services/socket'

// ── Shared helpers ────────────────────────────────────────────────────────────
const Spin = () => <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>

const Label = ({children}) => <p style={{fontSize:'0.6875rem',fontWeight:700,color:'#555',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'0.375rem'}}>{children}</p>

const FormInput = ({label, ...props}) => (
  <div>
    {label && <Label>{label}</Label>}
    <input className="input" {...props} />
  </div>
)

const FormTextarea = ({label, rows=3, ...props}) => (
  <div>
    {label && <Label>{label}</Label>}
    <textarea className="input" rows={rows} style={{resize:'vertical',...(props.style||{})}} {...props} />
  </div>
)

// ── Notification Panel (violations) ──────────────────────────────────────────
function ViolationLog({ violations }) {
  if (!violations.length) return null
  return (
    <div style={{position:'fixed',bottom:'1.5rem',right:'1.5rem',zIndex:200,display:'flex',flexDirection:'column',gap:'0.5rem',maxWidth:360}}>
      {violations.slice(-3).map((v,i) => (
        <div key={i} className="animate-fade-in"
          style={{background:'#1a0a0a',border:'1px solid #ef444440',borderRadius:12,padding:'0.875rem 1rem',
            boxShadow:'0 8px 32px #00000080',display:'flex',gap:'0.75rem',alignItems:'flex-start'}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:v.autoSubmitted?'#ef4444':'#f59e0b',marginTop:5,flexShrink:0,animation:'countdownPulse 1s infinite'}} />
          <div>
            <p style={{fontSize:'0.8125rem',fontWeight:700,color:'#fff',marginBottom:'0.25rem'}}>
              {v.autoSubmitted ? 'Auto-Submitted' : `Tab Warning ${v.count}/3`}
            </p>
            <p style={{fontSize:'0.75rem',color:'#888',lineHeight:1.5}}>
              {v.userName} ({v.scholarNumber}) — {new Date(v.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── MCQ Questions ────────────────────────────────────────────────────────────
function MCQTab() {
  const [questions, setQuestions] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [editQ,     setEditQ]     = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [imgPreview,setImgPreview]= useState(null)
  const [imgFile,   setImgFile]   = useState(null)
  const fileRef = useRef()

  const blank = { questionText:'', options:['','','',''], correctOption:0, marks:4, negativeMarks:1, order:0 }
  const [form, setForm] = useState(blank)

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/admin/mcq/questions'); setQuestions(r.data.questions) }
    catch { toast.error('Failed to load questions') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openAdd  = () => { setForm(blank); setEditQ(null); setImgFile(null); setImgPreview(null); setShowForm(true); window.scrollTo({top:0,behavior:'smooth'}) }
  const openEdit = q => {
    setForm({ questionText:q.questionText, options:[...q.options], correctOption:q.correctOption, marks:q.marks, negativeMarks:q.negativeMarks, order:q.order||0 })
    setEditQ(q); setImgFile(null)
    setImgPreview(q.questionImage ? `${ROOT_URL}${q.questionImage}` : null)
    setShowForm(true); window.scrollTo({top:0,behavior:'smooth'})
  }
  const cancel = () => { setShowForm(false); setEditQ(null); setImgPreview(null); setImgFile(null) }

  const handleImg = e => {
    const f = e.target.files[0]; if (!f) return
    setImgFile(f)
    const r = new FileReader(); r.onload = ev => setImgPreview(ev.target.result); r.readAsDataURL(f)
  }

  const setOption = (i, v) => { const o=[...form.options]; o[i]=v; setForm(p=>({...p,options:o})) }

  const handleSave = async () => {
    if (!form.questionText.trim()) return toast.error('Question text is required')
    if (form.options.some(o => !o.trim())) return toast.error('All 4 options are required')
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('questionText', form.questionText)
      fd.append('options', JSON.stringify(form.options))
      fd.append('correctOption', form.correctOption)
      fd.append('marks', form.marks)
      fd.append('negativeMarks', form.negativeMarks)
      fd.append('order', form.order)
      if (imgFile) fd.append('questionImage', imgFile)
      const cfg = { headers:{ 'Content-Type':'multipart/form-data' } }
      if (editQ) { await api.put(`/admin/mcq/questions/${editQ._id}`, fd, cfg); toast.success('Question updated') }
      else       { await api.post('/admin/mcq/questions', fd, cfg);              toast.success('Question added') }
      cancel(); await load()
    } catch(err) { toast.error(err.response?.data?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  const performDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this MCQ question?')) return;
    try {
      await api.delete(`/admin/mcq/questions/${id}`);
      toast.success('Question deleted successfully');
      setSelectedIds(p => p.filter(x => x !== id));
      await load();
    } catch (err) {
      console.error('Delete block error:', err);
      toast.error('Deletion failed. Check server connection.');
    }
  }

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(questions.map(q => q._id))
    else setSelectedIds([])
  }
  const toggleSelect = (id) => {
    setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  const performMassDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedIds.length} questions?`)) return;
    try {
      await api.post('/admin/mcq/questions/mass-delete', { ids: selectedIds });
      toast.success(`${selectedIds.length} questions deleted successfully`);
      setSelectedIds([]);
      await load();
    } catch (err) {
      toast.error('Mass deletion failed.');
    }
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem',flexWrap:'wrap'}}>
        <div>
          <h2 style={{fontSize:'1rem',fontWeight:700,color:'#fff',letterSpacing:'-0.01em'}}>MCQ Questions</h2>
          <p style={{color:'#444',fontSize:'0.8125rem',marginTop:'0.25rem',fontFamily:'monospace'}}>{questions.length} questions · +{4} / −{1} marking</p>
        </div>
        <div style={{display:'flex', gap:'0.75rem'}}>
          {selectedIds.length > 0 && (
            <button onClick={performMassDelete} className="btn btn-danger animate-fade-in" style={{background:'#7f1d1d', color:'#fff'}}>
              Delete Selected ({selectedIds.length})
            </button>
          )}
          <button onClick={openAdd} className="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Add Question
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{background:'#111',border:'1px solid #222',borderRadius:14,padding:'1.5rem',display:'flex',flexDirection:'column',gap:'1.25rem'}} className="animate-fade-in">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <h3 style={{fontSize:'0.9375rem',fontWeight:700,color:'#fff',letterSpacing:'-0.01em'}}>
              {editQ ? 'Edit Question' : 'New Question'}
            </h3>
            <button onClick={cancel} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:'1.25rem',lineHeight:1,padding:'0.25rem'}}>×</button>
          </div>

          <FormTextarea label="Question Text *" rows={3} value={form.questionText}
            onChange={e=>setForm(p=>({...p,questionText:e.target.value}))} placeholder="Type your question here..." />

          {/* Image upload */}
          <div>
            <Label>Question Image (optional)</Label>
            <div style={{display:'flex',gap:'1rem',alignItems:'flex-start'}}>
              <div onClick={()=>fileRef.current?.click()}
                style={{flex:1,border:'1px dashed #333',borderRadius:10,padding:'1.25rem',textAlign:'center',cursor:'pointer',
                  background:'#0f0f0f',transition:'border-color 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#555'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='#333'}>
                <p style={{color:'#444',fontSize:'0.8125rem'}}>
                  {imgFile ? imgFile.name : 'Click to upload PNG, JPG, GIF — max 5MB'}
                </p>
                <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleImg} />
              </div>
              {imgPreview && (
                <div style={{position:'relative',flexShrink:0}}>
                  <img src={imgPreview} alt="" style={{width:120,height:80,objectFit:'cover',borderRadius:8,border:'1px solid #222'}} />
                  <button onClick={()=>{setImgFile(null);setImgPreview(null)}}
                    style={{position:'absolute',top:-8,right:-8,width:20,height:20,borderRadius:'50%',
                      background:'#ef4444',border:'none',color:'#fff',cursor:'pointer',fontSize:'12px',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
                </div>
              )}
            </div>
          </div>

          {/* Options */}
          <div>
            <Label>Answer Options — click letter to mark correct</Label>
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
              {form.options.map((opt,i) => {
                const isCorrect = form.correctOption === i
                return (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                    <button type="button" onClick={()=>setForm(p=>({...p,correctOption:i}))}
                      style={{width:36,height:36,borderRadius:8,flexShrink:0,border:'none',cursor:'pointer',
                        fontFamily:'JetBrains Mono,monospace',fontWeight:700,fontSize:'0.875rem',transition:'all 0.12s',
                        background: isCorrect?'#fff':'#1a1a1a', color: isCorrect?'#000':'#555',
                        outline: isCorrect?'2px solid #fff':'1px solid #222', outlineOffset: isCorrect?2:0}}>
                      {String.fromCharCode(65+i)}
                    </button>
                    <input value={opt} onChange={e=>setOption(i,e.target.value)}
                      className="input" style={{flex:1,borderColor:isCorrect?'#ffffff30':'',background:isCorrect?'#ffffff08':''}}
                      placeholder={`Option ${String.fromCharCode(65+i)}`} />
                    {isCorrect && <span style={{fontSize:'0.75rem',color:'#a1a1a1',flexShrink:0,fontWeight:500}}>Correct</span>}
                  </div>
                )
              })}
            </div>
            <p style={{fontSize:'0.75rem',color:'#333',marginTop:'0.5rem',fontFamily:'monospace'}}>
              Correct: Option {String.fromCharCode(65+form.correctOption)} · +{form.marks} marks · −{form.negativeMarks} wrong
            </p>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem'}}>
            <FormInput label="Marks (+)" type="number" min={1} value={form.marks} onChange={e=>setForm(p=>({...p,marks:+e.target.value}))} />
            <FormInput label="Negative (−)" type="number" min={0} value={form.negativeMarks} onChange={e=>setForm(p=>({...p,negativeMarks:+e.target.value}))} />
            <FormInput label="Display Order" type="number" min={0} value={form.order} onChange={e=>setForm(p=>({...p,order:+e.target.value}))} />
          </div>

          <div style={{display:'flex',gap:'0.75rem',paddingTop:'0.25rem'}}>
            <button onClick={cancel} className="btn btn-ghost" style={{flex:1}}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{flex:2}}>
              {saving?<><Spin/>{editQ?'Updating...':'Adding...'}</>:editQ?'Update Question':'Add Question'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'4rem',gap:'0.75rem',color:'#333'}}>
          <Spin/><span style={{fontFamily:'monospace',fontSize:'0.875rem'}}>Loading...</span>
        </div>
      ) : questions.length === 0 && !showForm ? (
        <div style={{textAlign:'center',padding:'4rem',color:'#333'}}>
          <p style={{fontSize:'0.9375rem',color:'#444',marginBottom:'0.5rem'}}>No questions yet</p>
          <p style={{fontSize:'0.8125rem'}}>Click "Add Question" to create your first MCQ.</p>
        </div>
      ) : (
        <div className="table-wrapper animate-slide-down">
          <table className="table">
            <thead>
              <tr>
                <th style={{width:40, textAlign:'center'}}>
                  <input type="checkbox" onChange={toggleSelectAll} checked={questions.length > 0 && selectedIds.length === questions.length} style={{cursor:'pointer'}} />
                </th>
                <th style={{width:48}}>#</th>
                <th>Question</th>
                <th>Options</th>
                <th>Marks</th>
                <th style={{textAlign:'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q,i) => (
                <tr key={q._id} style={{background: selectedIds.includes(q._id) ? 'rgba(0,255,102,0.05)' : 'transparent'}}>
                  <td style={{textAlign:'center'}}>
                    <input type="checkbox" checked={selectedIds.includes(q._id)} onChange={()=>toggleSelect(q._id)} style={{cursor:'pointer'}} />
                  </td>
                  <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.75rem',color:'#555'}}>{i+1}</td>
                  <td style={{maxWidth:320}}>
                    <p style={{fontSize:'0.875rem',color:'var(--text-1)',lineHeight:1.6,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{q.questionText}</p>
                    {q.questionImage && <div style={{marginTop:'0.375rem'}}><span className="badge badge-muted">Has Image</span></div>}
                  </td>
                  <td style={{maxWidth:280}}>
                    <div style={{display:'flex',flexDirection:'column',gap:'0.25rem'}}>
                      {q.options.map((opt,oi)=>(
                        <div key={oi} style={{display:'flex',alignItems:'center',gap:'0.375rem',fontSize:'0.75rem'}}>
                          <span style={{color: oi===q.correctOption?'var(--success)':'#555',fontFamily:'JetBrains Mono,monospace',fontWeight:oi===q.correctOption?700:500}}>{String.fromCharCode(65+oi)}.</span>
                          <span style={{color: oi===q.correctOption?'var(--text-1)':'var(--text-3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{opt}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div style={{display:'flex',flexDirection:'column',gap:'0.25rem',fontSize:'0.75rem',fontFamily:'monospace',color:'var(--text-2)'}}>
                      <span style={{color:'var(--success)',fontWeight:600}}>+{q.marks} Correct</span>
                      <span style={{color:'var(--danger)',fontWeight:600}}>−{q.negativeMarks} Wrong</span>
                    </div>
                  </td>
                  <td>
                    <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
                      <button onClick={()=>openEdit(q)} className="btn btn-secondary" style={{padding:'0.375rem 0.625rem',fontSize:'0.75rem'}}>Edit</button>
                      <button onClick={()=>performDelete(q._id)} className="btn btn-danger" style={{padding:'0.375rem 0.625rem',fontSize:'0.75rem'}}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}

// ── Test Config ───────────────────────────────────────────────────────────────
function ConfigTab() {
  const blank = { mcqStartTime:'', mcqEndTime:'', mcqDuration:45, mcqQuestionCount:30 }
  const [form,    setForm]    = useState(blank)
  const [saving,  setSaving]  = useState(false)
  const [loading, setLoading] = useState(true)
  const [saved,   setSaved]   = useState(false)

  useEffect(() => {
    api.get('/admin/config').then(r => {
      if (r.data.config) {
        const c = r.data.config
        const fmt = d => d ? new Date(d).toISOString().slice(0,16) : ''
        setForm({ mcqStartTime:fmt(c.mcqStartTime), mcqEndTime:fmt(c.mcqEndTime), mcqDuration:c.mcqDuration||45, mcqQuestionCount:c.mcqQuestionCount||30 })
      }
    }).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!form.mcqStartTime || !form.mcqEndTime) return toast.error('Start and end time are required')
    if (new Date(form.mcqEndTime) <= new Date(form.mcqStartTime)) return toast.error('End time must be after start time')
    setSaving(true)
    try {
      await api.post('/admin/config', form)
      setSaved(true); toast.success('Configuration saved and broadcast to all candidates')
      setTimeout(() => setSaved(false), 4000)
    } catch(err) { toast.error(err.response?.data?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'4rem',gap:'0.75rem',color:'#333'}}><Spin/><span style={{fontFamily:'monospace',fontSize:'0.875rem'}}>Loading...</span></div>

  return (
    <div style={{maxWidth:560,display:'flex',flexDirection:'column',gap:'1.5rem'}}>
      <div>
        <h2 style={{fontSize:'1rem',fontWeight:700,color:'#fff',letterSpacing:'-0.01em'}}>Test Configuration</h2>
        <p style={{color:'#444',fontSize:'0.8125rem',marginTop:'0.25rem'}}>
          Changes are broadcast in real time to all connected candidates.
        </p>
      </div>

      <div className="alert-info">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}>
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <span>Once saved, candidate dashboards will immediately reflect the new schedule and begin counting down to the start time.</span>
      </div>

      <div style={{background:'#111',border:'1px solid #1a1a1a',borderRadius:14,padding:'1.5rem',display:'flex',flexDirection:'column',gap:'1.25rem'}}>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
          <div>
            <Label>Start Date &amp; Time *</Label>
            <input type="datetime-local" value={form.mcqStartTime}
              onChange={e=>setForm(p=>({...p,mcqStartTime:e.target.value}))}
              className="input" style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.875rem'}} />
          </div>
          <div>
            <Label>End Date &amp; Time *</Label>
            <input type="datetime-local" value={form.mcqEndTime}
              onChange={e=>setForm(p=>({...p,mcqEndTime:e.target.value}))}
              className="input" style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.875rem'}} />
          </div>
          <FormInput label="Duration (minutes)" type="number" min={1} value={form.mcqDuration}
            onChange={e=>setForm(p=>({...p,mcqDuration:+e.target.value}))} />
          <FormInput label="Number of Questions" type="number" min={1} value={form.mcqQuestionCount}
            onChange={e=>setForm(p=>({...p,mcqQuestionCount:+e.target.value}))} />
        </div>

        <button onClick={handleSave} disabled={saving} className="btn btn-primary"
          style={{alignSelf:'flex-start',padding:'0.75rem 1.5rem'}}>
          {saving ? <><Spin/>Saving...</> : saved ? '✓ Saved & Broadcast' : 'Save & Broadcast to Candidates'}
        </button>
      </div>
    </div>
  )
}

// ── Results ───────────────────────────────────────────────────────────────────
function ResultsTab() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy,  setSortBy]  = useState('score')
  const [sortDir, setSortDir] = useState('desc')
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    api.get('/admin/results/mcq')
      .then(r => setResults(r.data.results))
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false))
  }, [])

  const toggleSort = col => { if(sortBy===col) setSortDir(d=>d==='asc'?'desc':'asc'); else{setSortBy(col);setSortDir('desc')} }

  const filtered = results.filter(r => {
    const q = search.toLowerCase()
    return !q || r.userId?.name?.toLowerCase().includes(q) || r.userId?.scholarNumber?.toLowerCase().includes(q)
  })
  const sorted = [...filtered].sort((a,b) => {
    const va = sortBy==='name'?(a.userId?.name||''):a[sortBy]??0
    const vb = sortBy==='name'?(b.userId?.name||''):b[sortBy]??0
    if (typeof va==='string') return sortDir==='asc'?va.localeCompare(vb):vb.localeCompare(va)
    return sortDir==='asc'?va-vb:vb-va
  })

  const exportCSV = () => {
    const rows = [
      ['Rank','Name','Scholar No.','Branch','Score','Attempted','Correct','Wrong','Submitted'],
      ...sorted.map((r,i)=>[i+1,r.userId?.name,r.userId?.scholarNumber,r.userId?.branch,r.score,r.attempted,r.correct,r.wrong,new Date(r.submittedAt).toLocaleString()])
    ]
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'}))
    a.download = `mcq_results_${new Date().toISOString().slice(0,10)}.csv`
    a.click(); toast.success('CSV exported')
  }

  const SortBtn = ({col,children}) => (
    <th onClick={()=>toggleSort(col)} style={{padding:'0.75rem 1rem',textAlign:'left',fontSize:'0.6875rem',fontWeight:700,color:sortBy===col?'#fff':'#444',letterSpacing:'0.06em',textTransform:'uppercase',cursor:'pointer',whiteSpace:'nowrap',userSelect:'none'}}>
      {children} {sortBy===col?(sortDir==='asc'?'↑':'↓'):''}
    </th>
  )

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'4rem',gap:'0.75rem',color:'#333'}}><Spin/><span style={{fontFamily:'monospace',fontSize:'0.875rem'}}>Loading...</span></div>

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
        <div>
          <h2 style={{fontSize:'1rem',fontWeight:700,color:'#fff',letterSpacing:'-0.01em'}}>MCQ Results</h2>
          <p style={{color:'#444',fontSize:'0.8125rem',marginTop:'0.25rem',fontFamily:'monospace'}}>{results.length} submissions · Admin-only view</p>
        </div>
        <div style={{display:'flex',gap:'0.75rem'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} className="input"
            style={{width:200,fontSize:'0.875rem'}} placeholder="Search name or scholar no..." />
          <button onClick={exportCSV} className="btn btn-secondary" style={{flexShrink:0}}>Export CSV</button>
        </div>
      </div>

      {results.length > 0 && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.75rem'}}>
          {[
            ['Total Submissions', results.length],
            ['Average Score',     Math.round(results.reduce((s,r)=>s+r.score,0)/results.length)],
            ['Top Score',         Math.max(...results.map(r=>r.score))],
            ['Avg Accuracy',      `${Math.round(results.reduce((s,r)=>s+(r.attempted>0?r.correct/r.attempted*100:0),0)/results.length)}%`],
          ].map(([label,value])=>(
            <div key={label} style={{background:'#111',border:'1px solid #1a1a1a',borderRadius:12,padding:'1rem',textAlign:'center'}}>
              <p style={{fontSize:'1.375rem',fontWeight:800,color:'#fff',fontFamily:'JetBrains Mono,monospace',letterSpacing:'-0.02em'}}>{value}</p>
              <p style={{fontSize:'0.6875rem',color:'#444',fontWeight:600,letterSpacing:'0.04em',textTransform:'uppercase',marginTop:'0.25rem'}}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {sorted.length === 0 ? (
        <div style={{textAlign:'center',padding:'4rem',color:'#333'}}>
          <p style={{fontSize:'0.9375rem',color:'#444'}}>{search ? 'No results match your search.' : 'No submissions yet.'}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th style={{padding:'0.75rem 1rem',fontSize:'0.6875rem',fontWeight:700,color:'#444',letterSpacing:'0.06em',textTransform:'uppercase'}}>#</th>
                <SortBtn col="name">Name</SortBtn>
                <th style={{padding:'0.75rem 1rem',fontSize:'0.6875rem',fontWeight:700,color:'#444',letterSpacing:'0.06em',textTransform:'uppercase'}}>Scholar No.</th>
                <th style={{padding:'0.75rem 1rem',fontSize:'0.6875rem',fontWeight:700,color:'#444',letterSpacing:'0.06em',textTransform:'uppercase'}}>Branch</th>
                <SortBtn col="score">Score</SortBtn>
                <SortBtn col="attempted">Attempted</SortBtn>
                <SortBtn col="correct">Correct</SortBtn>
                <SortBtn col="wrong">Wrong</SortBtn>
                <th style={{padding:'0.75rem 1rem',fontSize:'0.6875rem',fontWeight:700,color:'#444',letterSpacing:'0.06em',textTransform:'uppercase'}}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r,i)=>(
                <tr key={r._id}>
                  <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.75rem',color:'#444'}}>{i+1}</td>
                  <td style={{fontWeight:600,color:'#fff'}}>{r.userId?.name||'N/A'}</td>
                  <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.8125rem',color:'#555'}}>{r.userId?.scholarNumber}</td>
                  <td><span className="badge badge-muted">{r.userId?.branch}</span></td>
                  <td><span style={{fontFamily:'JetBrains Mono,monospace',fontWeight:800,fontSize:'1rem',color:r.score>=0?'#fff':'#f87171'}}>{r.score}</span></td>
                  <td style={{fontFamily:'JetBrains Mono,monospace',color:'#a1a1a1'}}>{r.attempted}</td>
                  <td style={{fontFamily:'JetBrains Mono,monospace',color:'#22c55e',fontWeight:700}}>{r.correct}</td>
                  <td style={{fontFamily:'JetBrains Mono,monospace',color:'#f87171',fontWeight:700}}>{r.wrong}</td>
                  <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.75rem',color:'#444'}}>{new Date(r.submittedAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Participants ──────────────────────────────────────────────────────────────
function ParticipantsTab() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    api.get('/admin/participants')
      .then(r=>setUsers(r.data.users))
      .catch(()=>toast.error('Failed to load'))
      .finally(()=>setLoading(false))
  },[])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return !q || u.name.toLowerCase().includes(q) || u.scholarNumber.toLowerCase().includes(q) || u.branch.toLowerCase().includes(q)
  })

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'4rem',gap:'0.75rem',color:'#333'}}><Spin/><span style={{fontFamily:'monospace',fontSize:'0.875rem'}}>Loading...</span></div>

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
        <div>
          <h2 style={{fontSize:'1rem',fontWeight:700,color:'#fff',letterSpacing:'-0.01em'}}>Participants</h2>
          <p style={{color:'#444',fontSize:'0.8125rem',marginTop:'0.25rem',fontFamily:'monospace'}}>{users.length} registered · {users.filter(u=>u.mcqSubmitted).length} submitted MCQ</p>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} className="input"
          style={{width:220,fontSize:'0.875rem'}} placeholder="Search name, scholar, branch..." />
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.75rem'}}>
        {[
          ['Registered', users.length],
          ['MCQ Submitted', users.filter(u=>u.mcqSubmitted).length],
          ['Pending', users.filter(u=>!u.mcqSubmitted).length],
        ].map(([label,value])=>(
          <div key={label} style={{background:'#111',border:'1px solid #1a1a1a',borderRadius:12,padding:'1rem',textAlign:'center'}}>
            <p style={{fontSize:'1.375rem',fontWeight:800,color:'#fff',fontFamily:'JetBrains Mono,monospace'}}>{value}</p>
            <p style={{fontSize:'0.6875rem',color:'#444',fontWeight:600,letterSpacing:'0.04em',textTransform:'uppercase',marginTop:'0.25rem'}}>{label}</p>
          </div>
        ))}
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              {['#','Name','Email','Scholar No.','Branch','MCQ','Registered'].map(h=>(
                <th key={h} style={{padding:'0.75rem 1rem',textAlign:'left',fontSize:'0.6875rem',fontWeight:700,color:'#444',letterSpacing:'0.06em',textTransform:'uppercase'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u,i)=>(
              <tr key={u._id}>
                <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.75rem',color:'#444'}}>{i+1}</td>
                <td style={{fontWeight:600,color:'#fff'}}>{u.name}</td>
                <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.75rem',color:'#555'}}>{u.email}</td>
                <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.8125rem',color:'#555'}}>{u.scholarNumber}</td>
                <td><span className="badge badge-muted">{u.branch}</span></td>
                <td><span className={`badge ${u.mcqSubmitted?'badge-success':'badge-muted'}`}>{u.mcqSubmitted?'Submitted':'Pending'}</span></td>
                <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.75rem',color:'#444'}}>{new Date(u.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length===0 && <div style={{textAlign:'center',padding:'2.5rem',color:'#444',fontSize:'0.875rem'}}>No users match your search.</div>}
      </div>
    </div>
  )
}

// ── Main Admin Panel ──────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [tab,        setTab]        = useState('questions')
  const [stats,      setStats]      = useState({participants:0,mcq:0})
  const [violations, setViolations] = useState([])
  const { logout } = useAuth()
  const navigate   = useNavigate()

  // Connect to admin socket room for violation notifications
  useEffect(() => {
    connectAdminSocket()
    socket.on('violation:tab', (data) => {
      setViolations(p => [...p, data])
      const msg = data.autoSubmitted
        ? `Auto-submitted: ${data.userName} (${data.scholarNumber})`
        : `Tab warning ${data.count}/3: ${data.userName}`
      toast.error(msg, { duration: 8000, style:{background:'#1a0a0a',borderColor:'#ef444440',color:'#f87171'} })
    })
    return () => socket.off('violation:tab')
  }, [])

  useEffect(() => {
    Promise.all([api.get('/admin/participants'), api.get('/admin/results/mcq')])
      .then(([p,m]) => setStats({ participants:p.data.users?.length||0, mcq:m.data.results?.length||0 }))
      .catch(() => {})
  }, [])

  const tabs = [
    { id:'questions', label:'Questions' },
    { id:'config',    label:'Test Config' },
    { id:'results',   label:'Results',      badge: stats.mcq },
    { id:'participants',label:'Participants',badge: stats.participants },
  ]

  return (
    <div style={{minHeight:'100vh',background:'#0a0a0a'}}>

      {/* Header */}
      <header style={{position:'sticky',top:0,zIndex:50,background:'#0a0a0a',borderBottom:'1px solid #1a1a1a'}}>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'0 1.5rem',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:'1.25rem'}}>
            <VisionLogo size="sm" />
            <div style={{width:1,height:20,background:'#1a1a1a'}} />
            <span className="badge badge-muted">Admin Panel</span>
            {violations.length > 0 && (
              <span className="badge badge-danger"
                style={{animation:'countdownPulse 2s infinite'}}>
                {violations.filter(v=>v.autoSubmitted).length} auto-submitted
              </span>
            )}
          </div>
          <div style={{display:'flex',gap:'0.625rem'}}>
            <button onClick={()=>navigate('/dashboard')} className="btn btn-ghost" style={{fontSize:'0.8125rem',padding:'0.4375rem 0.875rem'}}>View Portal</button>
            <button onClick={()=>{logout();navigate('/admin/login')}} className="btn btn-danger" style={{fontSize:'0.8125rem',padding:'0.4375rem 0.875rem'}}>Sign Out</button>
          </div>
        </div>
      </header>

      <main style={{maxWidth:1280,margin:'0 auto',padding:'2rem 1.5rem'}}>

        {/* Page title */}
        <div style={{marginBottom:'2rem'}}>
          <h1 style={{fontSize:'1.5rem',fontWeight:800,color:'#fff',letterSpacing:'-0.03em'}}>Dashboard</h1>
          <p style={{color:'#444',fontSize:'0.875rem',marginTop:'0.375rem'}}>Vision CSE Recruitment · Admin Control Panel</p>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem',marginBottom:'2rem'}}>
          {[
            ['Registered Candidates', stats.participants],
            ['MCQ Submissions', stats.mcq],
            ['Completion Rate', stats.participants>0?`${Math.round(stats.mcq/stats.participants*100)}%`:'—'],
            ['Tab Violations', violations.length],
          ].map(([label,value],i)=>(
            <div key={label} style={{background:'#111',border:'1px solid #1a1a1a',borderRadius:12,padding:'1.25rem'}}>
              <p style={{fontSize:'1.5rem',fontWeight:800,color: i===3&&violations.length>0?'#f87171':'#fff',fontFamily:'JetBrains Mono,monospace',letterSpacing:'-0.02em'}}>{value}</p>
              <p style={{fontSize:'0.6875rem',color:'#444',fontWeight:600,letterSpacing:'0.05em',textTransform:'uppercase',marginTop:'0.375rem'}}>{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:0,borderBottom:'1px solid #1a1a1a',marginBottom:'1.75rem',overflowX:'auto'}}>
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{
                display:'flex',alignItems:'center',gap:'0.5rem',
                padding:'0.75rem 1.25rem',background:'none',border:'none',cursor:'pointer',
                borderBottom: tab===t.id?'2px solid #fff':'2px solid transparent',
                color: tab===t.id?'#fff':'#555',
                fontWeight: tab===t.id?600:500,
                fontSize:'0.875rem',letterSpacing:'-0.01em',
                transition:'color 0.15s',whiteSpace:'nowrap',
                marginBottom: -1,
              }}>
              {t.label}
              {t.badge != null && (
                <span style={{
                  fontSize:'0.6875rem',fontWeight:700,padding:'0.1rem 0.45rem',
                  borderRadius:99,fontFamily:'JetBrains Mono,monospace',
                  background: tab===t.id?'#ffffff15':'#1a1a1a',
                  color: tab===t.id?'#fff':'#444'
                }}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="animate-fade-in">
          {tab==='questions'    && <MCQTab />}
          {tab==='config'       && <ConfigTab />}
          {tab==='results'      && <ResultsTab />}
          {tab==='participants' && <ParticipantsTab />}
        </div>
      </main>

      {/* Live violation toasts */}
      <ViolationLog violations={violations} />
    </div>
  )
}