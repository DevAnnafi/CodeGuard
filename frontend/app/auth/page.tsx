'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isRegister, setIsRegister] = useState(false)
  const [dark, setDark] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', username: '', password: '' })

  useEffect(() => {
    setIsRegister(searchParams.get('mode') === 'register')
    const token = localStorage.getItem('cg_token')
    if (token) router.push('/review')
  }, [])

  const d = dark
  const bg        = d ? '#0f0f0d' : '#F5F2ED'
  const border    = d ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,24,0.1)'
  const text      = d ? '#e8e5e0' : '#1a1a18'
  const textMuted = d ? 'rgba(232,229,224,0.35)' : 'rgba(26,26,24,0.35)'
  const inputBg   = d ? 'rgba(255,255,255,0.05)' : 'rgba(26,26,24,0.04)'
  const btnBg     = d ? '#e8e5e0' : '#1a1a18'
  const btnText   = d ? '#0f0f0d' : '#F5F2ED'
  const cardBg    = d ? '#1c1c1a' : '#ffffff'

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
      const body = isRegister
        ? { email: form.email, username: form.username, password: form.password }
        : { email: form.email, password: form.password }

      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Something went wrong')
        return
      }

      localStorage.setItem('cg_token', data.access_token)
      localStorage.setItem('cg_username', data.username)
      router.push('/review')
    } catch (e) {
      setError('Could not connect to server')
    } finally {
      setLoading(false)
    }
  }

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
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
        .auth-card { animation: fadeUp 0.3s ease both; }
        input { outline: none; }
        input:focus { border-color: ${text} !important; }
        .submit-btn:hover { opacity: 0.88; }
        .toggle-link:hover { opacity: 0.7; }
      `}</style>

      <div className="grain" />

      <div style={{ width:'100%', minHeight:'100vh', display:'flex', flexDirection:'column', background:bg, transition:'background 0.25s' }}>

        {/* Nav */}
        <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 40px', borderBottom:`1px solid ${border}` }}>
          <div
            onClick={() => router.push('/')}
            style={{ fontFamily:'DM Mono, monospace', fontSize:13, fontWeight:500, letterSpacing:'0.08em', color:text, display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}
          >
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 8px #22c55e', animation:'pulse 2s ease-in-out infinite' }} />
            CODEGUARD
          </div>
          <button
            onClick={() => setDark(!d)}
            style={{ fontFamily:'DM Mono, monospace', fontSize:11, fontWeight:500, letterSpacing:'0.06em', padding:'6px 14px', borderRadius:20, border:`1px solid ${border}`, background:inputBg, color:text, cursor:'pointer' }}
          >
            {d ? '○ LIGHT' : '● DARK'}
          </button>
        </nav>

        {/* Main */}
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 20px' }}>
          <div style={{ width:'100%', maxWidth:440, display:'flex', flexDirection:'column', gap:24 }}>

            {/* Card */}
            <div className="auth-card" style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:16, padding:'40px 36px' }}>

              {/* Header */}
              <div style={{ marginBottom:32 }}>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, fontWeight:500, letterSpacing:'0.14em', color:'#22c55e', marginBottom:10, textTransform:'uppercase' }}>
                  {isRegister ? 'Create account' : 'Welcome back'}
                </div>
                <h1 style={{ fontSize:26, fontWeight:500, color:text, letterSpacing:'-0.01em', lineHeight:1.2 }}>
                  {isRegister ? 'Get started for free' : 'Sign in to CodeGuard'}
                </h1>
              </div>

              {/* Fields */}
              <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:24 }}>
                {isRegister && (
                  <div>
                    <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, color:textMuted, letterSpacing:'0.08em', marginBottom:6, textTransform:'uppercase' }}>Username</div>
                    <input
                      value={form.username}
                      onChange={e => setForm({...form, username: e.target.value})}
                      placeholder=""
                      style={{ width:'100%', fontFamily:'DM Mono, monospace', fontSize:12, background:inputBg, border:`1px solid ${border}`, borderRadius:8, padding:'11px 14px', color:text, transition:'border-color 0.15s' }}
                    />
                  </div>
                )}
                <div>
                  <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, color:textMuted, letterSpacing:'0.08em', marginBottom:6, textTransform:'uppercase' }}>Email</div>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    placeholder=""
                    style={{ width:'100%', fontFamily:'DM Mono, monospace', fontSize:12, background:inputBg, border:`1px solid ${border}`, borderRadius:8, padding:'11px 14px', color:text, transition:'border-color 0.15s' }}
                  />
                </div>
                <div>
                  <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, color:textMuted, letterSpacing:'0.08em', marginBottom:6, textTransform:'uppercase' }}>Password</div>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    placeholder={isRegister ? '' : '••••••••'}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    style={{ width:'100%', fontFamily:'DM Mono, monospace', fontSize:12, background:inputBg, border:`1px solid ${border}`, borderRadius:8, padding:'11px 14px', color:text, transition:'border-color 0.15s' }}
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:'#ef4444', marginBottom:16, padding:'10px 14px', background:'rgba(239,68,68,0.08)', borderRadius:8, border:'1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="submit-btn"
                style={{ width:'100%', fontFamily:'DM Mono, monospace', fontSize:12, fontWeight:500, letterSpacing:'0.08em', padding:'13px 24px', background:btnBg, color:btnText, border:'none', borderRadius:10, cursor: loading ? 'not-allowed' : 'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity: loading ? 0.5 : 1 }}
              >
                {loading
                  ? <><div style={{ width:12, height:12, border:`1.5px solid ${btnText}30`, borderTopColor:btnText, borderRadius:'50%', animation:'spin 0.7s linear infinite' }} /> {isRegister ? 'CREATING ACCOUNT...' : 'SIGNING IN...'}</>
                  : `→ ${isRegister ? 'CREATE ACCOUNT' : 'SIGN IN'}`}
              </button>

              {/* Toggle */}
              <div style={{ marginTop:20, textAlign:'center', fontFamily:'DM Mono, monospace', fontSize:11, color:textMuted }}>
                {isRegister ? 'Already have an account?' : "Don't have an account?"}
                {' '}
                <span
                  className="toggle-link"
                  onClick={() => { setIsRegister(!isRegister); setError('') }}
                  style={{ color:text, cursor:'pointer', textDecoration:'underline', transition:'opacity 0.15s' }}
                >
                  {isRegister ? 'Sign in' : 'Register'}
                </span>
              </div>
            </div>

            {/* Bottom note */}
            <div style={{ textAlign:'center', fontFamily:'DM Mono, monospace', fontSize:10, color:textMuted, letterSpacing:'0.06em' }}>
              BY CONTINUING YOU AGREE TO OUR TERMS OF SERVICE
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  )
}