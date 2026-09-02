'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function SignIn() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [method, setMethod] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState('');
  const [methods, setMethods] = useState<string[]>([]);
  const [challengeCodes, setChallengeCodes] = useState<Record<string, string>>({});
  const [challengeTokens, setChallengeTokens] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setMsg('');
    try {
      if (!challenge) {
        const r = await api('/api/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify({ login, password }),
        });
        if (!r.data.mfaRequired) {
          location.href = '/dashboard';
          return;
        }
        setMethods(r.data.methods || []);
        setChallengeCodes(Object.fromEntries((r.data.methods || []).map((m: string) => [m, r.data.challenges?.[m]?.code || ''])));
        setChallengeTokens(Object.fromEntries((r.data.methods || []).map((m: string) => [m, r.data.challenges?.[m]?.challenge || ''])));
        const first = r.data.methods?.[0] || '';
        setMethod(first);
        setChallenge(r.data.challenges?.[first]?.challenge || '');
        setCode(r.data.challenges?.[first]?.code || '');
      } else {
        await api('/api/v1/auth/mfa/verify', {
          method: 'POST',
          body: JSON.stringify({ challenge, method, code }),
        });
        location.href = '/dashboard';
      }
    } catch (error: any) {
      setMsg(error.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }

  function selectMethod(next: string) {
    setMethod(next);
    setCode(challengeCodes[next] || '');
    setChallenge(challengeTokens[next] || '');
  }

  return <main className="container flex min-h-[calc(100vh-64px)] items-center justify-center py-12">
    <div className="surface w-full max-w-md rounded-3xl p-7">
      <div className="eyebrow">Account</div>
      <h1 className="mt-2 text-3xl font-semibold">{challenge ? 'Verify your identity' : 'Welcome back'}</h1>
      <p className="mt-2 text-sm muted">{challenge ? 'Choose a configured second factor and complete the verification step.' : 'Sign in to access your dashboard and community account.'}</p>
      {!challenge ? <>
        <label className="mt-6 block text-sm"><span className="mb-2 block muted">Email or username</span><input autoComplete="username" className="w-full rounded-xl border border-white/10 bg-white/[.03] px-3 py-3 outline-none focus:border-cyan-300/30" value={login} onChange={e=>setLogin(e.target.value)} /></label>
        <label className="mt-4 block text-sm"><span className="mb-2 block muted">Password</span><input autoComplete="current-password" type="password" className="w-full rounded-xl border border-white/10 bg-white/[.03] px-3 py-3 outline-none focus:border-cyan-300/30" value={password} onChange={e=>setPassword(e.target.value)} /></label>
        <div className="mt-4 flex justify-between text-sm"><Link href="/forgot-password" className="text-cyan-200">Forgot password?</Link><Link href="/sign-up" className="muted hover:text-white">Create account</Link></div>
      </> : <>
        <div className="mt-6 flex flex-wrap gap-2">{methods.map(m=><button key={m} onClick={()=>selectMethod(m)} className={`rounded-lg px-3 py-2 text-xs ${method===m?'bg-white/[.1] text-white':'surface-soft muted'}`}>{m}</button>)}</div>
        {(method === 'TELEGRAM' || method === 'DISCORD') && challengeCodes[method] && <div className="note mt-4"><div className="text-xs uppercase tracking-[.12em] text-cyan-300">Bot approval code</div><div className="mt-2 font-mono text-xl tracking-[.25em]">{challengeCodes[method]}</div><div className="mt-1 text-xs muted">Send this one-time code to the linked {method.toLowerCase()} security bot, then click Verify.</div></div>}
        <label className="mt-4 block text-sm"><span className="mb-2 block muted">Verification code</span><input inputMode="numeric" autoComplete="one-time-code" className="w-full rounded-xl border border-white/10 bg-white/[.03] px-3 py-3 tracking-[.3em] outline-none focus:border-cyan-300/30" value={code} onChange={e=>setCode(e.target.value)} /></label>
      </>}
      {msg&&<div className="mt-4 rounded-xl border border-red-400/15 bg-red-400/[.05] p-3 text-sm text-red-200">{msg}</div>}
      <button disabled={loading} onClick={submit} className="btn-primary mt-6 w-full">{loading?'Working…':challenge?'Verify':'Sign in'}</button>
    </div>
  </main>;
}
