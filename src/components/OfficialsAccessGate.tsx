import React, { useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';

interface Props { onAuthenticated: (data: { token: string; username: string; display_name: string; role: 'admin'|'sub_official' }) => void; }

export const OfficialsAccessGate: React.FC<Props> = ({ onAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const r = await fetch('/api/official-auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username, password}) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Invalid credentials.');
      onAuthenticated({ token:data.token, username:data.official.username, display_name:data.official.display_name, role:data.official.role });
    } catch (err) { setError(err instanceof Error ? err.message : 'Login failed.'); }
    finally { setLoading(false); }
  };

  return <section className="mx-auto max-w-md rounded-2xl border border-sky-200 bg-white p-6 shadow-sm">
    <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-sky-100 p-3 text-sky-700"><KeyRound className="h-5 w-5"/></div><div><h2 className="text-base font-semibold text-stone-900">Officials Secure Login</h2><p className="text-xs text-stone-500">Sign in with an official account stored in PostgreSQL.</p></div></div>
    <form onSubmit={login} className="space-y-3">
      <input required value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" autoComplete="username" className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-xs text-stone-800" />
      <input required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-xs text-stone-800" />
      {error && <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700">{error}</div>}
      <button disabled={loading} className="w-full rounded-xl bg-sky-700 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{loading ? 'Signing in...' : 'Sign in to Officials Dashboard'}</button>
    </form>
    <div className="mt-4 flex gap-2 text-[11px] text-stone-500"><ShieldCheck className="h-4 w-4 shrink-0 text-sky-600"/>Admin can create sub-official accounts. Sub-officials can access monitoring but cannot create more officials.</div>
  </section>;
};
