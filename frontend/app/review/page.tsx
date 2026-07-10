'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Editor from '@monaco-editor/react'

interface Finding {
  line: number | null
  severity: string
  category: string
  message: string
  suggestion: string
}

interface ReviewResult {
  findings: Finding[]
  summary: string
  overall_severity: string
  language: string
}

const SEVERITY_CONFIG: Record<string, { label: string; dot: string; text: string; border: string; darkText: string; darkBorder: string }> = {
  critical: { label: 'CRIT', dot: '#ef4444', text: '#dc2626', border: 'rgba(239,68,68,0.2)', darkText: '#f87171', darkBorder: 'rgba(239,68,68,0.3)' },
  high:     { label: 'HIGH', dot: '#f97316', text: '#ea580c', border: 'rgba(249,115,22,0.2)', darkText: '#fb923c', darkBorder: 'rgba(249,115,22,0.3)' },
  medium:   { label: 'MED',  dot: '#eab308', text: '#ca8a04', border: 'rgba(234,179,8,0.2)',  darkText: '#facc15', darkBorder: 'rgba(234,179,8,0.3)'  },
  low:      { label: 'LOW',  dot: '#3b82f6', text: '#2563eb', border: 'rgba(59,130,246,0.2)', darkText: '#60a5fa', darkBorder: 'rgba(59,130,246,0.3)' },
  info:     { label: 'INFO', dot: '#6b7280', text: '#4b5563', border: 'rgba(107,114,128,0.2)',darkText: '#9ca3af', darkBorder: 'rgba(107,114,128,0.3)'},
}

const LANGUAGE_MAP: Record<string, string> = {
  'py': 'python', 'js': 'javascript', 'ts': 'typescript',
  'go': 'go', 'java': 'java', 'rs': 'rust',
  'c': 'c', 'cpp': 'cpp', 'rb': 'ruby', 'php': 'php',
}

export default function Home() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('python')
  const [filename, setFilename] = useState('')
  const [context, setContext] = useState('')
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [rawChunks, setRawChunks] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'paste' | 'upload'>('paste')
  const [dark, setDark] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low' | 'info'>('all')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [user, setUser] = useState<string | null>(null)
  const [usage, setUsage] = useState<{ remaining: number; limit: number; used: number } | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const d = dark

  useEffect(() => {
    const token = localStorage.getItem('cg_token')
    const username = localStorage.getItem('cg_username')
    if (!token) {
      router.push('/auth')
      return
    }
    setUser(username)
    fetchUsage()
  }, [])

  const getToken = () => localStorage.getItem('cg_token') ?? ''

  const handleFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    setUploadedFile(file)
    setFilename(file.name)
    setLanguage(LANGUAGE_MAP[ext] ?? 'plaintext')
    const reader = new FileReader()
    reader.onload = (e) => setCode(e.target?.result as string ?? '')
    reader.readAsText(file)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const fetchUsage = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/review/usage', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      const data = await res.json()
      setUsage(data)
    } catch (e) {
      console.error(e)
    }
  }

  const startReview = async () => {
    setResult(null)
    setRawChunks('')
    setStreaming(true)
    setSeverityFilter('all')
    setRateLimited(false)

    if (mode === 'upload' && uploadedFile) {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      if (context) formData.append('context', context)
      try {
        const res = await fetch('http://localhost:8000/api/review/upload', {
          method: 'POST',
          body: formData,
          headers: { 'Authorization': `Bearer ${getToken()}` }
        })
        if (res.status === 429) {
          setRateLimited(true)
          return
        }
        const data = await res.json()
        setResult({ ...data, language })
        fetchUsage()
      } catch (e) { console.error(e) }
      finally { setStreaming(false) }
      return
    }

    const ws = new WebSocket('ws://localhost:8000/ws/review')
    wsRef.current = ws
    ws.onopen = () => ws.send(JSON.stringify({
      code, language, filename, context,
      token: getToken()
    }))
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'chunk') setRawChunks(prev => prev + data.content)
      else if (data.type === 'done') {
        setResult({ ...data.result, language })
        setStreaming(false)
        fetchUsage()
      }
      else if (data.type === 'rate_limited') {
        setRateLimited(true)
        setStreaming(false)
      }
      else if (data.type === 'error') { console.error(data.detail); setStreaming(false) }
    }
    ws.onclose = () => setStreaming(false)
  }

  const exportPDF = async () => {
    if (!result) return
    setExporting(true)
    try {
      const res = await fetch(`http://localhost:8000/api/review/export?filename=${filename || 'review'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(result)
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `codeguard_${filename || 'review'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
    } finally {
      setExporting(false)
    }
  }

  const fetchHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch('http://localhost:8000/api/history/', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      const data = await res.json()
      setHistory(data)
    } catch (e) {
      console.error(e)
    } finally {
      setHistoryLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('cg_token')
    localStorage.removeItem('cg_username')
    router.push('/auth')
  }

  const bg           = d ? '#0f0f0d' : '#F5F2ED'
  const border       = d ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,24,0.1)'
  const text         = d ? '#e8e5e0' : '#1a1a18'
  const textMuted    = d ? 'rgba(232,229,224,0.35)' : 'rgba(26,26,24,0.35)'
  const textDim      = d ? 'rgba(232,229,224,0.18)' : 'rgba(26,26,24,0.18)'
  const inputBg      = d ? 'rgba(255,255,255,0.05)' : 'rgba(26,26,24,0.04)'
  const btnBg        = d ? '#e8e5e0' : '#1a1a18'
  const btnText      = d ? '#0f0f0d' : '#F5F2ED'
  const cardBg       = d ? '#1c1c1a' : '#ffffff'
  const summaryBg    = d ? '#e8e5e0' : '#1a1a18'
  const summaryText  = d ? '#1a1a18' : 'rgba(245,242,237,0.75)'
  const summaryLabel = d ? 'rgba(26,26,24,0.45)' : 'rgba(245,242,237,0.35)'
  const editorTheme  = d ? 'vs-dark' : 'light'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${bg}; font-family: 'DM Sans', sans-serif; transition: background 0.25s; }
        .grain { position:fixed;inset:0;pointer-events:none;z-index:100;opacity:0.02;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 8px #22c55e}50%{opacity:0.5;box-shadow:0 0 3px #22c55e} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
        @keyframes slideInRight { from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)} }
        .finding-card { animation: slideIn 0.2s ease both; }
        .finding-card:hover { transform: translateX(2px) !important; }
        .export-btn:hover { opacity: 0.7 !important; }
        .filter-pill:hover { opacity: 0.8 !important; }
        .history-card:hover { border-color: ${d ? 'rgba(255,255,255,0.16)' : 'rgba(26,26,24,0.25)'} !important; }
        .history-sidebar { animation: slideInRight 0.2s ease both; }
        .logout-btn:hover { opacity: 0.7 !important; }
        input, select { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${border}; border-radius: 4px; }
      `}</style>

      <div className="grain" />

      <div style={{ width: '100%' }}>

        {/* Topbar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 40px', borderBottom:`1px solid ${border}`, transition:'border-color 0.25s' }}>
          <div style={{ fontFamily:'DM Mono, monospace', fontSize:13, fontWeight:500, letterSpacing:'0.08em', color:text, display:'flex', alignItems:'center', gap:10, transition:'color 0.25s' }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 8px #22c55e', animation:'pulse 2s ease-in-out infinite' }} />
            CODEGUARD
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {user && (
              <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:textMuted, letterSpacing:'0.05em' }}>
                {user}
              </div>
            )}
            {usage && (
              <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color: usage.remaining <= 1 ? '#ef4444' : textMuted, letterSpacing:'0.05em', padding:'6px 12px', borderRadius:20, border:`1px solid ${usage.remaining <= 1 ? 'rgba(239,68,68,0.3)' : border}`, background: usage.remaining <= 1 ? 'rgba(239,68,68,0.06)' : inputBg }}>
                {usage.remaining}/{usage.limit} left today
              </div>
            )}
            <button
              onClick={() => { setHistoryOpen(!historyOpen); if (!historyOpen) fetchHistory() }}
              style={{ fontFamily:'DM Mono, monospace', fontSize:11, fontWeight:500, letterSpacing:'0.06em', padding:'6px 14px', borderRadius:20, border:`1px solid ${border}`, background: historyOpen ? btnBg : inputBg, color: historyOpen ? btnText : text, cursor:'pointer', transition:'all 0.2s' }}
            >
              ⌂ HISTORY
            </button>
            <button
              onClick={() => setDark(!d)}
              style={{ fontFamily:'DM Mono, monospace', fontSize:11, fontWeight:500, letterSpacing:'0.06em', padding:'6px 14px', borderRadius:20, border:`1px solid ${border}`, background:inputBg, color:text, cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', gap:6 }}
            >
              {d ? '○ LIGHT' : '● DARK'}
            </button>
            <button
              className="logout-btn"
              onClick={logout}
              style={{ fontFamily:'DM Mono, monospace', fontSize:11, fontWeight:500, letterSpacing:'0.06em', padding:'6px 14px', borderRadius:20, border:`1px solid ${border}`, background:inputBg, color:text, cursor:'pointer', transition:'all 0.2s' }}
            >
              → LOGOUT
            </button>
          </div>
        </div>

        {/* Layout */}
        <div style={{ position:'relative', display:'grid', gridTemplateColumns:'1fr 1fr', height:'calc(100vh - 61px)', overflow:'hidden' }}>

          {/* Left panel */}
          <div style={{ padding:'32px 40px', borderRight:`1px solid ${border}`, display:'flex', flexDirection:'column', gap:20, transition:'border-color 0.25s', height:'100%', overflowY:'auto' }}>

            <div>
              <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, fontWeight:500, letterSpacing:'0.12em', color:textMuted, textTransform:'uppercase', marginBottom:8 }}>Input mode</div>
              <div style={{ display:'flex', background:inputBg, borderRadius:8, padding:3, width:'fit-content', gap:2 }}>
                {(['paste','upload'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)} style={{ fontFamily:'DM Mono, monospace', fontSize:11, fontWeight:500, letterSpacing:'0.06em', padding:'6px 18px', borderRadius:6, border:'none', cursor:'pointer', transition:'all 0.15s', background: mode === m ? btnBg : 'transparent', color: mode === m ? btnText : textMuted }}>
                    {m === 'paste' ? 'PASTE' : 'UPLOAD'}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'paste' && (
              <>
                <div style={{ display:'flex', gap:10 }}>
                  <select value={language} onChange={e => setLanguage(e.target.value)}
                    style={{ fontFamily:'DM Mono, monospace', fontSize:12, background:inputBg, border:`1px solid ${border}`, borderRadius:8, padding:'8px 12px', color:text, transition:'all 0.2s', cursor:'pointer' }}>
                    {['python','javascript','typescript','go','java','rust','c','cpp','ruby','php'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <input value={filename} onChange={e => setFilename(e.target.value)} placeholder="filename.py"
                    style={{ fontFamily:'DM Mono, monospace', fontSize:12, flex:1, background:inputBg, border:`1px solid ${border}`, borderRadius:8, padding:'8px 12px', color:text, transition:'all 0.2s' }} />
                </div>
                <div style={{ borderRadius:10, overflow:'hidden', border:`1px solid ${border}`, flex:1 }}>
                  <Editor height="420px" language={language} value={code} onChange={v => setCode(v ?? '')}
                    theme={editorTheme}
                    options={{ fontSize:12, minimap:{enabled:false}, scrollBeyondLastLine:false, fontFamily:'DM Mono, monospace', lineHeight:20 }} />
                </div>
              </>
            )}

            {mode === 'upload' && (
              <>
                <input ref={fileInputRef} type="file" style={{ display:'none' }}
                  accept=".py,.js,.ts,.go,.java,.rs,.c,.cpp,.rb,.php"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border:`1.5px dashed ${isDragging ? '#22c55e' : uploadedFile ? '#22c55e' : border}`, borderStyle: uploadedFile ? 'solid' : 'dashed', borderRadius:12, padding:'48px 24px', textAlign:'center', cursor:'pointer', transition:'all 0.2s', minHeight:200, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, background: isDragging || uploadedFile ? 'rgba(34,197,94,0.04)' : 'transparent' }}>
                  {uploadedFile ? (
                    <>
                      <div style={{ fontFamily:'DM Mono, monospace', fontSize:14, fontWeight:500, color:'#22c55e' }}>{uploadedFile.name}</div>
                      <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:textMuted }}>{language} · {(uploadedFile.size/1024).toFixed(1)} kb</div>
                      <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:textDim, marginTop:4 }}>click to replace</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontFamily:'DM Mono, monospace', fontSize:13, fontWeight:500, color:text }}>drop file here</div>
                      <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:textMuted }}>or click to browse</div>
                      <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:textDim, marginTop:8 }}>py · js · ts · go · java · rs · c · cpp</div>
                    </>
                  )}
                </div>
                {uploadedFile && code && (
                  <div style={{ borderRadius:10, overflow:'hidden', border:`1px solid ${border}` }}>
                    <div style={{ padding:'8px 14px', background: d ? '#111110' : '#1a1a18', fontFamily:'DM Mono, monospace', fontSize:10, color:'rgba(245,242,237,0.3)', letterSpacing:'0.08em', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                      PREVIEW — {filename}
                    </div>
                    <Editor height="280px" language={language} value={code} theme="vs-dark"
                      options={{ fontSize:12, minimap:{enabled:false}, readOnly:true, scrollBeyondLastLine:false, fontFamily:'DM Mono, monospace', lineHeight:20 }} />
                  </div>
                )}
              </>
            )}

            <input value={context} onChange={e => setContext(e.target.value)}
              placeholder="context — e.g. auth module, payment handler"
              style={{ fontFamily:'DM Mono, monospace', fontSize:12, background:inputBg, border:`1px solid ${border}`, borderRadius:8, padding:'10px 14px', color:text, width:'100%', transition:'all 0.2s' }} />

            <button onClick={startReview}
              disabled={streaming || rateLimited || (mode==='upload' && !uploadedFile) || (mode==='paste' && !code)}
              style={{ fontFamily:'DM Mono, monospace', fontSize:12, fontWeight:500, letterSpacing:'0.08em', padding:'13px 24px', background: rateLimited ? 'rgba(239,68,68,0.12)' : btnBg, color: rateLimited ? '#ef4444' : btnText, border: rateLimited ? '1px solid rgba(239,68,68,0.3)' : 'none', borderRadius:10, cursor: rateLimited ? 'not-allowed' : 'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity: (streaming || (mode==='upload' && !uploadedFile) || (mode==='paste' && !code && !rateLimited)) ? 0.35 : 1 }}>
              {streaming
                ? <><div style={{ width:12, height:12, border:`1.5px solid ${btnText}30`, borderTopColor:btnText, borderRadius:'50%', animation:'spin 0.7s linear infinite' }} /> ANALYZING</>
                : rateLimited ? '⊘ DAILY LIMIT REACHED'
                : '→ RUN ANALYSIS'}
            </button>
          </div>

          {/* Right panel */}
          <div style={{ padding:'32px 40px', overflowY:'auto', height:'100%', background: d ? '#0f0f0d' : '#F5F2ED', transition:'background 0.25s' }}>

            {!streaming && !result && !rateLimited && (
              <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, opacity:0.25 }}>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:32 }}>⌥</div>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:12, color:text }}>awaiting input</div>
              </div>
            )}

            {rateLimited && (
              <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:'40px' }}>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:32, opacity:0.4 }}>⊘</div>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:13, fontWeight:500, color:text, textAlign:'center' }}>Daily limit reached</div>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:textMuted, textAlign:'center', lineHeight:1.7 }}>
                  Free tier allows 5 reviews per day.<br />Upgrade to Pro for unlimited reviews.
                </div>
                <button
                  onClick={() => router.push('/#pricing')}
                  style={{ fontFamily:'DM Mono, monospace', fontSize:11, fontWeight:500, letterSpacing:'0.08em', padding:'10px 24px', borderRadius:10, border:'none', background:btnBg, color:btnText, cursor:'pointer', marginTop:8 }}
                >
                  → UPGRADE TO PRO
                </button>
              </div>
            )}

            {streaming && !result && (
              <>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, letterSpacing:'0.1em', color:textMuted, marginBottom:12, textTransform:'uppercase', display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', animation:'pulse 1s ease-in-out infinite' }} />
                  live stream
                </div>
                <div style={{ background:'#1a1a18', borderRadius:12, padding:20, fontFamily:'DM Mono, monospace', fontSize:11, color:'#22c55e', whiteSpace:'pre-wrap', lineHeight:1.6, maxHeight:500, overflowY:'auto' }}>
                  {rawChunks}
                </div>
              </>
            )}

            {result && (() => {
              const os = SEVERITY_CONFIG[result.overall_severity] ?? SEVERITY_CONFIG.info
              const filteredFindings = result.findings.filter(f => severityFilter === 'all' || f.severity === severityFilter)

              return (
                <>
                  <div style={{ background:summaryBg, borderRadius:14, padding:24, marginBottom:20, transition:'background 0.25s' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                      <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, fontWeight:500, letterSpacing:'0.12em', color:summaryLabel, textTransform:'uppercase' }}>Analysis complete</div>
                      <span style={{ fontFamily:'DM Mono, monospace', fontSize:10, fontWeight:500, letterSpacing:'0.1em', padding:'4px 10px', borderRadius:20, border:`1px solid ${d ? os.darkBorder : os.border}`, color: d ? os.darkText : os.text, whiteSpace:'nowrap', flexShrink:0 }}>
                        {os.label}
                      </span>
                    </div>
                    <div style={{ fontSize:13, color:summaryText, lineHeight:1.65, fontWeight:300 }}>{result.summary}</div>
                  </div>

                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, fontWeight:500, letterSpacing:'0.12em', color:textMuted, textTransform:'uppercase' }}>Findings</div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:textMuted }}>
                        {result.findings.length} issue{result.findings.length !== 1 ? 's' : ''}
                      </div>
                      <button
                        className="export-btn"
                        onClick={exportPDF}
                        disabled={exporting}
                        style={{ fontFamily:'DM Mono, monospace', fontSize:10, fontWeight:500, letterSpacing:'0.08em', padding:'5px 12px', borderRadius:6, border:`1px solid ${border}`, background:inputBg, color:text, cursor:'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', gap:6, opacity: exporting ? 0.4 : 1 }}
                      >
                        {exporting
                          ? <><div style={{ width:9, height:9, border:`1.5px solid ${text}30`, borderTopColor:text, borderRadius:'50%', animation:'spin 0.7s linear infinite' }} /> EXPORTING</>
                          : '↓ EXPORT PDF'}
                      </button>
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
                    {(['all', 'critical', 'high', 'medium', 'low', 'info'] as const).map(sev => {
                      const count = sev === 'all'
                        ? result.findings.length
                        : result.findings.filter(f => f.severity === sev).length
                      if (sev !== 'all' && count === 0) return null
                      const s = sev === 'all' ? null : SEVERITY_CONFIG[sev]
                      const isActive = severityFilter === sev
                      return (
                        <button
                          key={sev}
                          className="filter-pill"
                          onClick={() => setSeverityFilter(sev)}
                          style={{
                            fontFamily:'DM Mono, monospace', fontSize:10, fontWeight:500,
                            letterSpacing:'0.08em', padding:'4px 10px', borderRadius:20,
                            border:`1px solid ${isActive ? (s ? s.dot : border) : border}`,
                            background: isActive ? (s ? `${s.dot}18` : inputBg) : 'transparent',
                            color: isActive ? (s ? (d ? s.darkText : s.text) : text) : textMuted,
                            cursor:'pointer', transition:'all 0.15s'
                          }}
                        >
                          {sev.toUpperCase()} ({count})
                        </button>
                      )
                    })}
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {filteredFindings.map((f, i) => {
                      const s = SEVERITY_CONFIG[f.severity] ?? SEVERITY_CONFIG.info
                      return (
                        <div key={i} className="finding-card" style={{ background:cardBg, borderRadius:12, padding:'18px 20px', border:`1px solid ${border}`, transition:'border-color 0.15s, transform 0.15s, background 0.25s' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                            <div style={{ width:7, height:7, borderRadius:'50%', background:s.dot, flexShrink:0 }} />
                            <span style={{ fontFamily:'DM Mono, monospace', fontSize:10, fontWeight:500, letterSpacing:'0.1em', color: d ? s.darkText : s.text }}>{s.label}</span>
                            <span style={{ fontFamily:'DM Mono, monospace', fontSize:10, background:inputBg, color:textMuted, padding:'2px 8px', borderRadius:4 }}>{f.category}</span>
                            {f.line && <span style={{ fontFamily:'DM Mono, monospace', fontSize:10, color:textDim, marginLeft:'auto' }}>:{f.line}</span>}
                          </div>
                          <div style={{ fontSize:13, color:text, lineHeight:1.6, marginBottom:10, fontWeight:400 }}>{f.message}</div>
                          <div style={{ fontSize:12, color:textMuted, lineHeight:1.6, borderTop:`1px solid ${border}`, paddingTop:10, fontWeight:300 }}>
                            <span style={{ color:'#22c55e', marginRight:4, fontWeight:500 }}>→</span>{f.suggestion}
                          </div>
                        </div>
                      )
                    })}
                    {filteredFindings.length === 0 && (
                      <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:textMuted, textAlign:'center', padding:'32px 0' }}>
                        no {severityFilter} findings
                      </div>
                    )}
                  </div>
                </>
              )
            })()}
          </div>

          {/* History sidebar */}
          {historyOpen && (
            <div className="history-sidebar" style={{ position:'absolute', top:0, right:0, width:380, height:'100%', background: d ? '#141412' : '#ffffff', borderLeft:`1px solid ${border}`, zIndex:50, display:'flex', flexDirection:'column', boxShadow:'-8px 0 32px rgba(0,0,0,0.1)' }}>
              <div style={{ padding:'20px 24px', borderBottom:`1px solid ${border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, fontWeight:500, letterSpacing:'0.1em', color:textMuted, textTransform:'uppercase' }}>Review History</div>
                <button onClick={() => setHistoryOpen(false)} style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:textMuted, background:'transparent', border:'none', cursor:'pointer' }}>✕</button>
              </div>
              <div style={{ flex:1, overflowY:'auto', padding:'12px' }}>
                {historyLoading && (
                  <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:textMuted, textAlign:'center', padding:'32px 0' }}>loading...</div>
                )}
                {!historyLoading && history.length === 0 && (
                  <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:textMuted, textAlign:'center', padding:'32px 0' }}>no reviews yet</div>
                )}
                {!historyLoading && history.map((h) => {
                  const s = SEVERITY_CONFIG[h.overall_severity] ?? SEVERITY_CONFIG.info
                  return (
                    <div
                      key={h.id}
                      className="history-card"
                      onClick={() => {
                        setResult({
                          findings: h.findings,
                          summary: h.summary,
                          overall_severity: h.overall_severity,
                          language: h.language
                        })
                        setSeverityFilter('all')
                        setHistoryOpen(false)
                      }}
                      style={{ padding:'14px', borderRadius:10, border:`1px solid ${border}`, marginBottom:8, cursor:'pointer', transition:'all 0.15s', background:inputBg }}
                    >
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                        <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, fontWeight:500, color:text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>
                          {h.filename || 'untitled'}
                        </div>
                        <span style={{ fontFamily:'DM Mono, monospace', fontSize:10, fontWeight:500, padding:'2px 8px', borderRadius:20, border:`1px solid ${d ? s.darkBorder : s.border}`, color: d ? s.darkText : s.text, flexShrink:0 }}>
                          {s.label}
                        </span>
                      </div>
                      <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, color:textMuted, marginBottom:6 }}>
                        {h.language} · {h.findings.length} issue{h.findings.length !== 1 ? 's' : ''}
                      </div>
                      <div style={{ fontSize:11, color:textMuted, lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as const }}>
                        {h.summary}
                      </div>
                      <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, color:textDim, marginTop:8 }}>
                        {new Date(h.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}