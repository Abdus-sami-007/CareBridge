import React, { useState } from 'react';
import { Database, UserPlus } from 'lucide-react';
import { VictimDbRecord } from '../types';

interface OfficialsVictimManagerProps {
  victims: VictimDbRecord[];
  onSaved: () => void;
}

export const OfficialsVictimManager: React.FC<OfficialsVictimManagerProps> = ({ victims, onSaved }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [caseId, setCaseId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const saveVictim = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch('/api/database/victims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id.trim(), name: name.trim(), case_id: caseId.trim(), password })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save victim.');
      setId('');
      setName('');
      setCaseId('');
      setPassword('');
      setIsOpen(false);
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save victim.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-sky-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-sky-100 p-2 text-sky-700"><Database className="h-5 w-5" /></div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Victim Records</h3>
            <p className="text-xs text-stone-500">Stored in the active CareBridge database adapter</p>
          </div>
        </div>
        <button type="button" onClick={() => setIsOpen(open => !open)} className="inline-flex items-center gap-1.5 rounded-xl bg-sky-700 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-600">
          <UserPlus className="h-3.5 w-3.5" /> Add Victim
        </button>
      </div>

      {isOpen && (
        <form onSubmit={saveVictim} className="mt-4 grid grid-cols-1 gap-2 border-t border-stone-100 pt-4 sm:grid-cols-5">
          <input required value={id} onChange={event => setId(event.target.value)} placeholder="Victim ID" className="rounded-lg border border-stone-200 px-3 py-2 text-xs" />
          <input required value={name} onChange={event => setName(event.target.value)} placeholder="Full name" className="rounded-lg border border-stone-200 px-3 py-2 text-xs" />
          <input required value={caseId} onChange={event => setCaseId(event.target.value)} placeholder="Case ID" className="rounded-lg border border-stone-200 px-3 py-2 text-xs" />
          <input required minLength={8} type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Assign password (8+ chars)" className="rounded-lg border border-stone-200 px-3 py-2 text-xs" />
          <button disabled={isSaving} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{isSaving ? 'Saving...' : 'Save to database'}</button>
          {error && <div className="sm:col-span-4 text-xs text-rose-700">{error}</div>}
        </form>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {victims.map(victim => (
          <div key={victim.id} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
            <div className="text-xs font-semibold text-stone-900">{victim.name}</div>
            <div className="mt-1 font-mono text-[10px] text-stone-500">{victim.id} · {victim.case_id}</div>
            <div className="mt-2 text-[10px] text-stone-600">Score {victim.latest_score}/100 · {victim.risk_level}</div>
          </div>
        ))}
      </div>
    </section>
  );
};
