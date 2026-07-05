'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Landing() {
  const router = useRouter()
  const [dark, setDark] = useState(false)
  const d = dark

  const bg        = d ? '#0f0f0d' : '#F5F2ED'
  const border    = d ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,24,0.1)'
  const text      = d ? '#e8e5e0' : '#1a1a18'
  const textMuted = d ? 'rgba(232,229,224,0.35)' : 'rgba(26,26,24,0.35)'
  const textDim   = d ? 'rgba(232,229,224,0.18)' : 'rgba(26,26,24,0.18)'
  const inputBg   = d ? 'rgba(255,255,255,0.05)' : 'rgba(26,26,24,0.04)'
  const btnBg     = d ? '#e8e5e0' : '#1a1a18'
  const btnText   = d ? '#0f0f0d' : '#F5F2ED'
  const cardBg    = d ? '#1c1c1a' : '#ffffff'

  const features = [
    { icon: '⚡', title: 'Real-time streaming', desc: 'Watch findings appear as Claude analyzes your code token by token over WebSocket.' },
    { icon: '⌖', title: 'OWASP Top 10', desc: 'Detects injection, broken auth, secrets exposure, XSS, CSRF, path traversal and more.' },
    { icon: '⤒', title: 'File upload', desc: 'Drag and drop any source file — language is auto-detected, preview loads instantly.' },
    { icon: '↧', title: 'PDF export', desc: 'Download a branded security report with all findings, severities, and fix suggestions.' },
    { icon: '⌂', title: 'Review history', desc: 'Every analysis is saved and browsable — reload past findings in one click.' },
    { icon: '⚿', title: 'Secure by default', desc: 'JWT auth scopes your history to your account. No review leaks between users.' },
  ]

  const plans = [
    {
      name: 'FREE',
      price: '$0',
      period: 'forever',
      desc: 'For individuals exploring code security.',
      features: ['5 reviews per day', 'Paste mode only', 'Severity filter', 'PDF export'],
      cta: 'GET STARTED',
      highlight: false,
      action: () => router.push('/auth?mode=register'),
    },
    {
      name: 'PRO',
      price: '$12',
      period: 'per month',
      desc: 'For developers who ship code daily.',
      features: ['Unlimited reviews', 'File upload + drag & drop', 'Full review history', 'PDF export', 'Priority analysis'],
      cta: 'START FREE TRIAL',
      highlight: true,
      action: () => router.push('/auth?mode=register'),
    },
    {
      name: 'TEAM',
      price: '$49',
      period: 'per month',
      desc: 'For security-conscious engineering teams.',
      features: ['Everything in Pro', 'Up to 10 seats', 'Shared review history', 'API access', 'Priority support'],
      cta: 'CONTACT US',
      highlight: false,
      action: () => {},
    },
  ]

  const stats = [
    { value: '10+', label: 'Vulnerability categories' },
    { value: '<5s', label: 'Average analysis time' },
    { value: 'OWASP', label: 'Top 10 coverage' },
    { value: '8+', label: 'Languages supported' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${bg}; font-family: 'DM Sans', sans-serif; transition: background 0.25s; }
        .grain { position:fixed;inset:0;pointer-events:none;z-index:100;opacity:0.02;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 8px #22c55e}50%{opacity:0.5;box-shadow:0 0 3px #22c55e} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0}to{opacity:1} }
        .hero-badge { animation: fadeUp 0.5s ease 0s both; }
        .hero-title { animation: fadeUp 0.5s ease 0.1s both; }
        .hero-sub   { animation: fadeUp 0.5s ease 0.2s both; }
        .hero-cta   { animation: fadeUp 0.5s ease 0.3s both; }
        .hero-stats { animation: fadeUp 0.5s ease 0.4s both; }
        .feature-card { transition: all 0.2s; }
        .feature-card:hover { transform: translateY(-3px); border-color: ${d ? 'rgba(255,255,255,0.18)' : 'rgba(26,26,24,0.22)'} !important; }
        .plan-card { transition: all 0.2s; }
        .plan-card:hover { transform: translateY(-3px); }
        .nav-link { transition: color 0.15s; cursor: pointer; }
        .nav-link:hover { color: ${text} !important; }
        .cta-primary:hover { opacity: 0.88; }
        .cta-secondary:hover { background: ${inputBg} !important; }
        .check { color: #22c55e; font-size: 13px; flex-shrink: 0; }
        html { scroll-behavior: smooth; }
      `}</style>

      <div className="grain" />
      <div style={{ width:'100%', minHeight:'100vh', color:text }}>

        {/* Sticky Nav */}
        <nav style={{ position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 60px', borderBottom:`1px solid ${border}`, background:bg, backdropFilter:'blur(12px)', transition:'background 0.25s' }}>
          <div style={{ fontFamily:'DM Mono, monospace', fontSize:13, fontWeight:500, letterSpacing:'0.08em', color:text, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 8px #22c55e', animation:'pulse 2s ease-in-out infinite' }} />
            CODEGUARD
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:24 }}>
            <a href="#features" className="nav-link" style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:textMuted, textDecoration:'none', letterSpacing:'0.06em' }}>FEATURES</a>
            <a href="#pricing" className="nav-link" style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:textMuted, textDecoration:'none', letterSpacing:'0.06em' }}>PRICING</a>
            <button onClick={() => setDark(!d)} style={{ fontFamily:'DM Mono, monospace', fontSize:11, fontWeight:500, letterSpacing:'0.06em', padding:'6px 14px', borderRadius:20, border:`1px solid ${border}`, background:inputBg, color:text, cursor:'pointer', transition:'all 0.2s' }}>
              {d ? '○ LIGHT' : '● DARK'}
            </button>
            <button onClick={() => router.push('/auth')} style={{ fontFamily:'DM Mono, monospace', fontSize:11, fontWeight:500, letterSpacing:'0.06em', padding:'7px 18px', borderRadius:20, border:`1px solid ${border}`, background:'transparent', color:text, cursor:'pointer', transition:'all 0.2s' }}>
              LOGIN
            </button>
            <button onClick={() => router.push('/auth?mode=register')} className="cta-primary" style={{ fontFamily:'DM Mono, monospace', fontSize:11, fontWeight:500, letterSpacing:'0.06em', padding:'7px 18px', borderRadius:20, border:'none', background:btnBg, color:btnText, cursor:'pointer', transition:'all 0.2s' }}>
              GET STARTED
            </button>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ maxWidth:860, margin:'0 auto', padding:'130px 40px 100px', textAlign:'center' }}>
          <div className="hero-badge" style={{ display:'inline-flex', alignItems:'center', gap:8, fontFamily:'DM Mono, monospace', fontSize:11, fontWeight:500, letterSpacing:'0.12em', color:'#22c55e', marginBottom:28, padding:'6px 16px', borderRadius:20, border:'1px solid rgba(34,197,94,0.25)', background:'rgba(34,197,94,0.06)' }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:'#22c55e', animation:'pulse 2s ease-in-out infinite' }} />
            AI-POWERED SECURITY ANALYSIS
          </div>
          <h1 className="hero-title" style={{ fontSize:62, fontWeight:500, lineHeight:1.08, color:text, marginBottom:24, letterSpacing:'-0.025em' }}>
            Find vulnerabilities<br />before attackers do
          </h1>
          <p className="hero-sub" style={{ fontSize:18, color:textMuted, lineHeight:1.75, marginBottom:44, fontWeight:300, maxWidth:540, margin:'0 auto 44px' }}>
            CodeGuard uses Claude AI to review your code for OWASP Top 10 vulnerabilities, secrets exposure, injection attacks, and more — in seconds.
          </p>
          <div className="hero-cta" style={{ display:'flex', gap:12, justifyContent:'center', alignItems:'center', marginBottom:64 }}>
            <button onClick={() => router.push('/auth?mode=register')} className="cta-primary" style={{ fontFamily:'DM Mono, monospace', fontSize:12, fontWeight:500, letterSpacing:'0.08em', padding:'14px 36px', borderRadius:10, border:'none', background:btnBg, color:btnText, cursor:'pointer', transition:'all 0.2s' }}>
              → START FOR FREE
            </button>
            <button onClick={() => router.push('/review')} className="cta-secondary" style={{ fontFamily:'DM Mono, monospace', fontSize:12, fontWeight:500, letterSpacing:'0.08em', padding:'14px 36px', borderRadius:10, border:`1px solid ${border}`, background:'transparent', color:text, cursor:'pointer', transition:'all 0.2s' }}>
              LIVE DEMO
            </button>
          </div>

          {/* Stats bar */}
          <div className="hero-stats" style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:0, border:`1px solid ${border}`, borderRadius:14, overflow:'hidden', background:cardBg }}>
            {stats.map((s, i) => (
              <div key={i} style={{ padding:'24px 20px', textAlign:'center', borderRight: i < 3 ? `1px solid ${border}` : 'none' }}>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:22, fontWeight:500, color:text, marginBottom:4 }}>{s.value}</div>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, color:textMuted, letterSpacing:'0.08em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Mock terminal preview */}
        <section style={{ maxWidth:900, margin:'0 auto', padding:'0 40px 100px' }}>
          <div style={{ background:'#0f0f0d', borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:'#ef4444', opacity:0.7 }} />
              <div style={{ width:10, height:10, borderRadius:'50%', background:'#eab308', opacity:0.7 }} />
              <div style={{ width:10, height:10, borderRadius:'50%', background:'#22c55e', opacity:0.7 }} />
              <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:'rgba(255,255,255,0.2)', marginLeft:8, letterSpacing:'0.06em' }}>vulnerable_app.py — CODEGUARD</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
              {/* Code side */}
              <div style={{ padding:'24px', borderRight:'1px solid rgba(255,255,255,0.06)', fontFamily:'DM Mono, monospace', fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:2 }}>
                <div><span style={{ color:'rgba(255,255,255,0.2)' }}>1</span>  <span style={{ color:'#c792ea' }}>def</span> <span style={{ color:'#82aaff' }}>get_user</span>(user_id):</div>
                <div style={{ background:'rgba(239,68,68,0.12)', margin:'0 -24px', padding:'0 24px' }}>
                  <span style={{ color:'rgba(255,255,255,0.2)' }}>2</span>  {'  '}query = <span style={{ color:'#c3e88d' }}>f"SELECT * FROM users</span>
                </div>
                <div style={{ background:'rgba(239,68,68,0.12)', margin:'0 -24px', padding:'0 24px' }}>
                  <span style={{ color:'rgba(255,255,255,0.2)' }}>3</span>  {'  '}{'  '}<span style={{ color:'#c3e88d' }}>WHERE id = {'{user_id}'}"</span>
                </div>
                <div><span style={{ color:'rgba(255,255,255,0.2)' }}>4</span>  {'  '}<span style={{ color:'#c792ea' }}>return</span> db.execute(query)</div>
              </div>
              {/* Findings side */}
              <div style={{ padding:'24px', display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:9, letterSpacing:'0.12em', color:'rgba(255,255,255,0.25)', marginBottom:4 }}>ANALYSIS COMPLETE · CRITICAL</div>
                {[
                  { sev: 'CRIT', color: '#ef4444', cat: 'injection', msg: 'SQL injection via f-string interpolation' },
                  { sev: 'HIGH', color: '#f97316', cat: 'auth', msg: 'No input validation on user_id parameter' },
                  { sev: 'MED',  color: '#eab308', cat: 'misc', msg: 'SELECT * exposes sensitive columns' },
                ].map((f, i) => (
                  <div key={i} style={{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'10px 12px', border:'1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:f.color, flexShrink:0 }} />
                      <span style={{ fontFamily:'DM Mono, monospace', fontSize:9, fontWeight:500, color:f.color, letterSpacing:'0.1em' }}>{f.sev}</span>
                      <span style={{ fontFamily:'DM Mono, monospace', fontSize:9, color:'rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.06)', padding:'1px 6px', borderRadius:3 }}>{f.cat}</span>
                    </div>
                    <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, color:'rgba(255,255,255,0.55)', lineHeight:1.5 }}>{f.msg}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" style={{ maxWidth:1100, margin:'0 auto', padding:'80px 40px' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, fontWeight:500, letterSpacing:'0.14em', color:textMuted, textTransform:'uppercase', marginBottom:12 }}>Features</div>
            <h2 style={{ fontSize:36, fontWeight:500, color:text, letterSpacing:'-0.015em' }}>Everything you need to ship secure code</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14 }}>
            {features.map((f, i) => (
              <div key={i} className="feature-card" style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:14, padding:'28px 26px' }}>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:20, marginBottom:16, color:'#22c55e' }}>{f.icon}</div>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:12, fontWeight:500, color:text, marginBottom:10, letterSpacing:'0.04em' }}>{f.title}</div>
                <div style={{ fontSize:13, color:textMuted, lineHeight:1.7, fontWeight:300 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" style={{ maxWidth:1100, margin:'0 auto', padding:'80px 40px 120px' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, fontWeight:500, letterSpacing:'0.14em', color:textMuted, textTransform:'uppercase', marginBottom:12 }}>Pricing</div>
            <h2 style={{ fontSize:36, fontWeight:500, color:text, letterSpacing:'-0.015em' }}>Simple, transparent pricing</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14 }}>
            {plans.map((p, i) => (
              <div key={i} className="plan-card" style={{ background: p.highlight ? btnBg : cardBg, border:`1px solid ${p.highlight ? 'transparent' : border}`, borderRadius:16, padding:'32px 28px', display:'flex', flexDirection:'column' }}>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, fontWeight:500, letterSpacing:'0.14em', color: p.highlight ? (d ? 'rgba(15,15,13,0.4)' : 'rgba(245,242,237,0.4)') : textMuted, marginBottom:20, textTransform:'uppercase' }}>{p.name}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:6 }}>
                  <span style={{ fontSize:40, fontWeight:500, color: p.highlight ? btnText : text, letterSpacing:'-0.02em' }}>{p.price}</span>
                  <span style={{ fontFamily:'DM Mono, monospace', fontSize:11, color: p.highlight ? (d ? 'rgba(15,15,13,0.4)' : 'rgba(245,242,237,0.4)') : textMuted }}>{p.period}</span>
                </div>
                <div style={{ fontSize:13, color: p.highlight ? (d ? 'rgba(15,15,13,0.55)' : 'rgba(245,242,237,0.6)') : textMuted, marginBottom:28, lineHeight:1.6, fontWeight:300 }}>{p.desc}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:32, flex:1 }}>
                  {p.features.map((f, j) => (
                    <div key={j} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                      <span className="check">✓</span>
                      <span style={{ fontSize:13, color: p.highlight ? (d ? 'rgba(15,15,13,0.7)' : 'rgba(245,242,237,0.75)') : textMuted, lineHeight:1.5, fontWeight:300 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={p.action}
                  style={{ fontFamily:'DM Mono, monospace', fontSize:11, fontWeight:500, letterSpacing:'0.08em', padding:'12px 20px', borderRadius:10, border: p.highlight ? 'none' : `1px solid ${border}`, background: p.highlight ? (d ? '#0f0f0d' : '#F5F2ED') : inputBg, color: p.highlight ? (d ? '#e8e5e0' : '#1a1a18') : text, cursor:'pointer', transition:'all 0.2s' }}
                >
                  {p.cta} →
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Footer CTA */}
        <section style={{ borderTop:`1px solid ${border}`, padding:'80px 40px' }}>
          <div style={{ maxWidth:600, margin:'0 auto', textAlign:'center' }}>
            <h2 style={{ fontSize:36, fontWeight:500, color:text, marginBottom:16, letterSpacing:'-0.015em' }}>Ready to secure your code?</h2>
            <p style={{ fontSize:15, color:textMuted, marginBottom:36, lineHeight:1.7, fontWeight:300 }}>Join developers who ship with confidence. Start reviewing for free — no credit card required.</p>
            <button onClick={() => router.push('/auth?mode=register')} className="cta-primary" style={{ fontFamily:'DM Mono, monospace', fontSize:12, fontWeight:500, letterSpacing:'0.08em', padding:'14px 40px', borderRadius:10, border:'none', background:btnBg, color:btnText, cursor:'pointer', transition:'all 0.2s' }}>
              → GET STARTED FOR FREE
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop:`1px solid ${border}`, padding:'24px 60px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:textDim, letterSpacing:'0.06em' }}>CODEGUARD · {new Date().getFullYear()}</div>
          <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:textDim, letterSpacing:'0.06em' }}>BUILT WITH CLAUDE AI</div>
        </footer>

      </div>
    </>
  )
}