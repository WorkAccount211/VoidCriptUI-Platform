'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function VerifyEmail() {
  const [state, setState] = useState<'loading'|'success'|'error'>('loading');
  const [message, setMessage] = useState('Verifying your email…');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) { setState('error'); setMessage('Verification token is missing.'); return; }
    api(`/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => { setState('success'); setMessage('Your email is verified. You can now sign in.'); })
      .catch((error) => { setState('error'); setMessage(error.message || 'Verification failed.'); });
  }, []);

  return <main className="container flex min-h-[calc(100vh-64px)] items-center justify-center py-12"><div className="surface w-full max-w-md rounded-3xl p-7 text-center"><div className="eyebrow">Account verification</div><h1 className="mt-2 text-3xl font-semibold">{state === 'loading' ? 'Verifying…' : state === 'success' ? 'Email verified' : 'Verification failed'}</h1><p className="mt-3 text-sm muted">{message}</p><Link href="/sign-in" className="btn-primary mt-6 w-full">Continue to sign in</Link></div></main>;
}
