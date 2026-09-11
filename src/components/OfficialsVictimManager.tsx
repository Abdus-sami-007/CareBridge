import React, { useState } from 'react';
import { Database, UserPlus, Pencil, X } from 'lucide-react';
import { VictimDbRecord } from '../types';

interface OfficialsVictimManagerProps {
  victims: VictimDbRecord[];
  onSaved: () => void;
  isAdmin: boolean;
  authToken: string;
}

export const OfficialsVictimManager: React.FC<OfficialsVictimManagerProps> = ({ victims, onSaved, isAdmin, authToken }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [caseId, setCaseId] = useState('');
  const [password, setPassword] = useState('');
  const [doctorScore, setDoctorScore] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = (victim: VictimDbRecord) => {
    setEditingId(victim.id);
    setId(victim.id);
    setName(victim.name);
    setCaseId(victim.case_id);
    setPassword('');
    setDoctorScore(victim.doctor_initial_score != null ? String(victim.doctor_initial_score) : String(victim.baseline_distress_score ?? ''));
    setDoctorName(victim.doctor_name || '');
    setDoctorNotes(victim.doctor_notes || '');
    setTelegramUsername(victim.telegram_username || '');
    setError(null);
    setIsOpen(true);
  };

  const resetForm = () => {
    setEditingId(null); setId(''); setName(''); setCaseId(''); setPassword(''); setDoctorScore(''); setDoctorName(''); setDoctorNotes(''); setTelegramUsername(''); setError(null); setIsOpen(false);
  };

  const saveVictim = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch('/api/database/victims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ id: id.trim(), name: name.trim(), case_id: caseId.trim(), ...(password ? { password } : {}), ...(doctorScore !== '' ? { doctor_initial_score: Number(doctorScore), baseline_distress_score: Number(doctorScore) } : {}), doctor_name: doctorName.trim(), doctor_notes: doctorNotes.trim(), telegram_username: telegramUsername.replace(/^@/, '').trim() || null })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save victim.');
      resetForm();
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
            <p className="text-xs text-stone-500">Create a case with its clinician baseline before monitoring begins.</p>
          </div>
        </div>
        {isAdmin && <button type="button" onClick={() => { if (isOpen) resetForm(); else setIsOpen(true); }} className="inline-flex items-center gap-1.5 rounded-xl bg-sky-700 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-600">
          {editingId ? <Pencil className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />} {editingId ? 'Edit Victim' : 'Add Victim'}
        </button>}
      </div>

      {isOpen && (
        <form onSubmit={saveVictim} className="mt-4 grid grid-cols-1 gap-2 border-t border-stone-100 pt-4 sm:grid-cols-5">
          <input required value={id} onChange={event => setId(event.target.value)} placeholder="Victim ID" className="rounded-lg border border-stone-200 px-3 py-2 text-xs" />
          <input required value={name} onChange={event => setName(event.target.value)} placeholder="Full name" className="rounded-lg border border-stone-200 px-3 py-2 text-xs" />
          <input required value={caseId} onChange={event => setCaseId(event.target.value)} placeholder="Case ID" className="rounded-lg border border-stone-200 px-3 py-2 text-xs" />
          <input required={!editingId} minLength={editingId && !password ? undefined : 8} type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder={editingId ? 'New password (optional)' : 'Assign password (8+ chars)'} className="rounded-lg border border-stone-200 px-3 py-2 text-xs" />
          <input required={!editingId} type="number" min="0" max="100" value={doctorScore} onChange={event => setDoctorScore(event.target.value)} placeholder={editingId ? 'Doctor initial score /100' : 'Initial distress score /100 *'} className="rounded-lg border border-stone-200 px-3 py-2 text-xs" />
          <input value={doctorName} onChange={event => setDoctorName(event.target.value)} placeholder="Doctor / assessor" className="rounded-lg border border-stone-200 px-3 py-2 text-xs" />
          <input value={telegramUsername} onChange={event => setTelegramUsername(event.target.value)} placeholder="Telegram username (without @)" className="rounded-lg border border-stone-200 px-3 py-2 text-xs" />
          <input value={doctorNotes} onChange={event => setDoctorNotes(event.target.value)} placeholder="Initial clinical note" className="rounded-lg border border-stone-200 px-3 py-2 text-xs sm:col-span-2" />
          <button type="button" onClick={resetForm} className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600"><X className="mr-1 inline h-3.5 w-3.5" />Cancel</button>
          <button disabled={isSaving} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{isSaving ? 'Saving...' : editingId ? 'Update database' : 'Save to database'}</button>
          {error && <div className="sm:col-span-4 text-xs text-rose-700">{error}</div>}
        </form>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {victims.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-5 text-center text-xs text-stone-500 sm:col-span-3">No victim records yet. Add the first real case to populate the database.</div>
        ) : victims.map(victim => (
          <div key={victim.id} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
            <div className="flex justify-end"><button type="button" onClick={() => startEdit(victim)} className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1 text-[10px] font-semibold text-stone-600 hover:bg-stone-100"><Pencil className="h-3 w-3" /> Edit</button></div>
            <div className="text-xs font-semibold text-stone-900">{victim.name}</div>
            <div className="mt-1 font-mono text-[10px] text-stone-500">{victim.id} · {victim.case_id}</div>
            <div className="mt-2 text-[10px] text-stone-600">Initial {victim.doctor_initial_score ?? victim.baseline_distress_score}/100 · Current {victim.latest_score}/100 · {victim.risk_level}</div>
            {victim.closed && <div className="mt-1 text-[10px] font-semibold text-stone-500">Case closed</div>}
          </div>
        ))}
      </div>
    </section>
  );
};
