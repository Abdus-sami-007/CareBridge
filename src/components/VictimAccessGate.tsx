import React, { useState } from 'react';
import { LockKeyhole, ShieldCheck } from 'lucide-react';

interface VictimAccessGateProps {
  victimId: string;
  onAuthenticated: (victimId: string) => void;
}

export const VictimAccessGate: React.FC<VictimAccessGateProps> = ({ victimId, onAuthenticated }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const authenticate = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/victim-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ victimId, name, password })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Validation failed.');
      onAuthenticated(result.victim.id);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Validation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700"><LockKeyhole className="h-5 w-5" /></div>
        <div><h2 className="text-base font-semibold text-stone-900">Private Victim Access</h2><p className="text-xs text-stone-500">Validate your database record to continue.</p></div>
      </div>
      <form onSubmit={authenticate} className="space-y-3">
        <input required value={victimId} readOnly className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-mono text-stone-700" />
        <input required value={name} onChange={event => setName(event.target.value)} placeholder="Full name assigned by an official" className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-xs text-stone-800" />
        <input required type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Assigned password" className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-xs text-stone-800" />
        {error && <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700">{error}</div>}
        <button disabled={loading} className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{loading ? 'Checking record...' : 'Enter Victim Dashboard'}</button>
      </form>
      <div className="mt-4 flex gap-2 text-[11px] text-stone-500"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />Name and password are cross-checked against the protected victim record.</div>
    </section>
  );
};