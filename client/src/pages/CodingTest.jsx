import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import CodeEditor, { STARTERS } from '../components/CodeEditor'
import Timer from '../components/Timer'
import VisionLogo from '../components/VisionLogo'

const LANGUAGES = [
  { id: 'cpp', label: 'C++', icon: '⚙' },
  { id: 'c', label: 'C', icon: '🔧' },
  { id: 'python', label: 'Python', icon: '🐍' },
  { id: 'javascript', label: 'JavaScript', icon: '🟡' }
]

const DURATION = 45 * 60

const CodingTest = () => {
  const [questions, setQuestions] = useState([])
  const [activeQ, setActiveQ] = useState(0)
  const [language, setLanguage] = useState('cpp')
  const [codes, setCodes] = useState({})
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('problem') // 'problem' | 'io'
  const [showConfirm, setShowConfirm] = useState(false)
  const navigate = useNavigate()
  const tabWarnings = useRef(0)

  // Anti-cheat
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        tabWarnings.current++
        toast.error(`⚠ Tab switch detected! Warning ${tabWarnings.current}/3`, { duration: 4000 })
      }
    }
    const handleContextMenu = (e) => e.preventDefault()
    const handleKeyDown = (e) => {
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) e.preventDefault()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/coding/questions')
        setQuestions(res.data.questions)
        // Init code map with starters
        const initCodes = {}
        res.data.questions.forEach(q => {
          initCodes[q._id] = {}
          LANGUAGES.forEach(l => {
            initCodes[q._id][l.id] = STARTERS[l.id]
          })
        })
        setCodes(initCodes)
        // Load existing submissions
        const subRes = await api.get('/coding/submissions')
        const subMap = {}
        subRes.data.submissions.forEach(s => {
          subMap[s.questionId._id || s.questionId] = true
        })
        setSubmitted(subMap)
      } catch (err) {
        toast.error('Failed to load questions')
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const currentQuestion = questions[activeQ]
  const currentCode = currentQuestion ? (codes[currentQuestion._id]?.[language] || STARTERS[language]) : ''

  const handleCodeChange = (val) => {
    if (!currentQuestion) return
    setCodes(prev => ({
      ...prev,
      [currentQuestion._id]: {
        ...(prev[currentQuestion._id] || {}),
        [language]: val
      }
    }))
  }

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    setOutput('')
  }

  const handleRun = async () => {
    if (!currentCode.trim()) return toast.error('Write some code first!')
    setRunning(true)
    setOutput('')
    setActiveTab('io')
    try {
      const res = await api.post('/coding/run', {
        code: currentCode,
        language,
        input
      })
      setOutput(res.data.output || 'No output')
      toast.success('Code executed!')
    } catch (err) {
      setOutput(`Error: ${err.response?.data?.message || 'Execution failed'}`)
      toast.error('Execution failed')
    } finally {
      setRunning(false)
    }
  }

  const handleSubmit = async () => {
    if (!currentCode.trim()) return toast.error('Write some code first!')
    setSubmitting(true)
    try {
      await api.post('/coding/submit', {
        questionId: currentQuestion._id,
        code: currentCode,
        language
      })
      setSubmitted(prev => ({ ...prev, [currentQuestion._id]: true }))
      toast.success(`Problem ${activeQ + 1} submitted!`)
      setShowConfirm(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTimerExpire = async () => {
    toast.error('Time up! Auto-submitting all solutions...', { duration: 5000 })
    for (const q of questions) {
      if (!submitted[q._id]) {
        const code = codes[q._id]?.[language] || STARTERS[language]
        try {
          await api.post('/coding/submit', { questionId: q._id, code, language })
        } catch { /* best effort */ }
      }
    }
    navigate('/dashboard')
  }

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-neon font-mono animate-pulse text-lg">[ LOADING PROBLEMS... ]</div>
    </div>
  )

  if (questions.length === 0) return (
    <div className="min-h-screen bg-bg flex items-center justify-center flex-col gap-4">
      <div className="text-4xl">📭</div>
      <p className="text-gray-400 font-mono">No coding problems available yet.</p>
      <button onClick={() => navigate('/dashboard')} className="btn-outline text-sm px-5 py-2">
        ← Back to Dashboard
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-bg flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}
      onContextMenu={e => e.preventDefault()}>

      {/* Top Bar */}
      <div className="bg-card border-b border-gray-800 px-4 py-2.5 flex items-center justify-between gap-4 flex-shrink-0"
        style={{ boxShadow: '0 2px 20px #00ff8810' }}>
        <VisionLogo size="sm" />

        {/* Problem tabs */}
        <div className="flex gap-1">
          {questions.map((q, i) => (
            <button
              key={q._id}
              onClick={() => setActiveQ(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                i === activeQ
                  ? 'bg-neon/20 text-neon border border-neon/40'
                  : 'text-gray-400 hover:text-gray-200 border border-gray-800 hover:border-gray-600'
              }`}
            >
              {submitted[q._id] && <span className="text-neon">✓</span>}
              P{i + 1}
              <span className={`text-xs px-1 rounded ${
                q.difficulty === 'Easy' ? 'text-green-400' :
                q.difficulty === 'Medium' ? 'text-yellow-400' : 'text-red-400'
              }`}>{q.difficulty}</span>
            </button>
          ))}
        </div>

        <Timer durationSeconds={DURATION} onExpire={handleTimerExpire} warningAt={600} />
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Problem Statement */}
        <div className="w-[38%] border-r border-gray-800 flex flex-col overflow-hidden">
          {/* Problem header */}
          <div className="bg-card border-b border-gray-800 px-4 py-3 flex items-center justify-between">
            <div>
              <h2 className="font-mono font-bold text-textPrimary text-sm">
                {activeQ + 1}. {currentQuestion?.title}
              </h2>
              <span className={`text-xs font-mono ${
                currentQuestion?.difficulty === 'Easy' ? 'text-green-400' :
                currentQuestion?.difficulty === 'Medium' ? 'text-yellow-400' : 'text-red-400'
              }`}>{currentQuestion?.difficulty}</span>
            </div>
            {submitted[currentQuestion?._id] && (
              <span className="text-xs font-mono text-neon bg-neon/10 border border-neon/30 px-2 py-1 rounded">
                ✓ Submitted
              </span>
            )}
          </div>

          {/* Problem content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
            {currentQuestion && (
              <>
                <div>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{currentQuestion.description}</p>
                </div>

                <div className="bg-bg rounded-lg p-4 border border-gray-800">
                  <h4 className="text-xs font-mono text-gray-400 uppercase mb-2">Input Format</h4>
                  <p className="text-gray-300 text-xs font-mono whitespace-pre-wrap">{currentQuestion.inputFormat}</p>
                </div>

                <div className="bg-bg rounded-lg p-4 border border-gray-800">
                  <h4 className="text-xs font-mono text-gray-400 uppercase mb-2">Output Format</h4>
                  <p className="text-gray-300 text-xs font-mono whitespace-pre-wrap">{currentQuestion.outputFormat}</p>
                </div>

                <div className="bg-bg rounded-lg p-4 border border-gray-800">
                  <h4 className="text-xs font-mono text-gray-400 uppercase mb-2">Constraints</h4>
                  <p className="text-gray-300 text-xs font-mono whitespace-pre-wrap">{currentQuestion.constraints}</p>
                </div>

                {currentQuestion.examples?.map((ex, i) => (
                  <div key={i} className="space-y-2">
                    <h4 className="text-xs font-mono text-neon uppercase">Example {i + 1}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-bg rounded-lg p-3 border border-gray-800">
                        <p className="text-xs text-gray-500 font-mono mb-1">INPUT</p>
                        <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap break-all">{ex.input}</pre>
                      </div>
                      <div className="bg-bg rounded-lg p-3 border border-gray-800">
                        <p className="text-xs text-gray-500 font-mono mb-1">OUTPUT</p>
                        <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap break-all">{ex.output}</pre>
                      </div>
                    </div>
                    {ex.explanation && (
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-xs text-blue-300 font-mono">💡 {ex.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Editor + I/O */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Editor toolbar */}
          <div className="bg-card border-b border-gray-800 px-4 py-2 flex items-center justify-between flex-shrink-0">
            {/* Language selector */}
            <div className="flex gap-1">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => handleLanguageChange(lang.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                    language === lang.id
                      ? 'bg-neon/20 text-neon border border-neon/40'
                      : 'text-gray-400 border border-gray-800 hover:border-gray-600 hover:text-gray-200'
                  }`}
                >
                  <span>{lang.icon}</span>
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleRun}
                disabled={running}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40 hover:bg-blue-500/30 transition-all disabled:opacity-50"
              >
                {running ? (
                  <>
                    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    RUNNING...
                  </>
                ) : '▶ RUN CODE'}
              </button>

              <button
                onClick={() => setShowConfirm(true)}
                disabled={submitting || submitted[currentQuestion?._id]}
                className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all disabled:opacity-50 ${
                  submitted[currentQuestion?._id]
                    ? 'bg-neon/20 text-neon border border-neon/40 cursor-default'
                    : 'btn-neon'
                }`}
              >
                {submitted[currentQuestion?._id] ? '✓ SUBMITTED' : submitting ? 'SUBMITTING...' : '⬆ SUBMIT'}
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            <CodeEditor
              code={currentCode}
              language={language}
              onChange={handleCodeChange}
            />
          </div>

          {/* I/O Panel */}
          <div className="h-48 border-t border-gray-800 flex flex-col flex-shrink-0">
            {/* I/O Tabs */}
            <div className="flex border-b border-gray-800 bg-card">
              {['problem', 'io'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-mono transition-all ${
                    activeTab === tab
                      ? 'text-neon border-b border-neon'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab === 'problem' ? '📋 TESTCASE' : '🖥 OUTPUT'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-hidden flex">
              {activeTab === 'problem' ? (
                <div className="flex-1 flex flex-col p-3 gap-2">
                  <label className="text-xs font-mono text-gray-500">STDIN (Custom Input)</label>
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    className="flex-1 bg-bg border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 outline-none resize-none focus:border-neon/50"
                    placeholder="Enter custom input here..."
                  />
                </div>
              ) : (
                <div className="flex-1 p-3 overflow-auto">
                  <pre className={`text-xs font-mono whitespace-pre-wrap leading-relaxed ${
                    output.toLowerCase().includes('error') ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {running ? '⏳ Executing code...' : output || '// Run your code to see output here'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="card neon-border max-w-sm w-full animate-slide-in">
            <h3 className="text-lg font-mono font-bold text-textPrimary mb-2">Submit Solution?</h3>
            <p className="text-gray-400 text-sm mb-1">
              Problem: <span className="text-neon">{currentQuestion?.title}</span>
            </p>
            <p className="text-gray-400 text-sm mb-5">
              Language: <span className="text-neon font-mono">{language.toUpperCase()}</span>
            </p>
            <p className="text-yellow-400 text-xs mb-5">
              ⚠ You can re-submit, but only the latest code will be recorded.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="btn-outline flex-1 py-2 text-sm">CANCEL</button>
              <button onClick={handleSubmit} disabled={submitting}
                className="btn-neon flex-1 py-2 text-sm">
                {submitting ? 'SUBMITTING...' : 'CONFIRM'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CodingTest
