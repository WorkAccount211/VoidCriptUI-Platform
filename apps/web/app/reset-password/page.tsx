'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function ResetPassword() {
  const [token, setToken] = useState('');
  useEffect(() => { setToken(new URLSearchParams(window.location.search).get('token') || ''); }, []);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  async function submit() {
    if (!token) return setMessage('Reset token is missing.');
    if (password.length < 10) return setMessage('Use at least 10 characters.');
    if (password !== confirm) return setMessage('Passwords do not match.');
    try { await api('/api/v1/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }); setDone(true); setMessage('Password changed.'); }
    catch (error: any) { setMessage(error.message || 'Reset failed.'); }
  }
  return <main className="container flex min-h-[calc(100vh-64px)] items-center justify-center py-12"><div className="surface w-full max-w-md rounded-3xl p-7"><div className="eyebrow">Account recovery</div><h1 className="mt-2 text-3xl font-semibold">Set a new password</h1><p className="mt-2 text-sm muted">Use the single-use recovery link sent to your verified email.</p><label className="mt-6 block text-sm"><span className="mb-2 block muted">New password</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[.03] px-3 py-3 outline-none focus:border-cyan-300/30" /></label><label className="mt-4 block text-sm"><span className="mb-2 block muted">Confirm password</span><input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[.03] px-3 py-3 outline-none focus:border-cyan-300/30" /></label>{message&&<div className="mt-4 rounded-xl border border-white/10 bg-white/[.03] p-3 text-sm">{message}</div>}{done?<Link href="/sign-in" className="btn-primary mt-6 w-full">Go to sign in</Link>:<button onClick={submit} className="btn-primary mt-6 w-full">Reset password</button>}<Link href="/sign-in" className="mt-4 block text-center text-sm muted">Back to sign in</Link></div></main>;
}
